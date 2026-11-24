import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { Species } from '../../thermodynamics/enums';
import { GasPropertiesService } from '../../thermodynamics/services/gas-properties.service';
import { TransportService } from '../../thermodynamics/services/transport.service';
import { DiffusionService } from '../../thermodynamics/services/diffusion.service';
import { AerodynamicsService } from '../../thermodynamics/services/aerodynamics.service';
import { specialNu } from '../../thermodynamics/utils/nu-formulas/special.nu';
import { MultilayerWallService } from '../../thermal-exchange/services/multilayer-wall.service';
import { WallGeometry } from '../../thermal-exchange/enums/wall-geometry.enum';
import { UNIT_CONVERSION } from '../../../common/thermal/constants';
import { CHEMISTRY } from '../../../common/chemistry';
import { brentq } from '../../../common/utils/root-finding';
import { ATOMIC_MASS, BED_KINETICS, BED_REACTIONS, COMBUSTION } from '../constants';
import {
  BedConditions, BedGeometry, EffectiveDiffusion, GasStream, LayerState, MarchResult,
  SteamInjection,
} from '../types';
import { ReactionExtentsDto } from '../dto/bed';
import { ElementFlows, GasFlows, ReactionExtents } from '../types';
import { elementsOfCondensed } from '../utils/element-balance';
import { gasMassFlow, moleFractions, sumFlows, totalMoles } from '../utils/gas-flows';
import { toSpeciesValues } from '../utils/step-result';
import { BedSmoke } from '../utils/bed-smoke';
import { ChemicalKineticsService } from './chemical-kinetics.service';
import { CombustionEnthalpyService } from './combustion-enthalpy.service';
import { ProductEquilibriumService } from './product-equilibrium.service';

/**
 * Packed-bed layer march: kinetics, solid/gas temperatures, wall loss, extents.
 * Stateless orchestration helper for {@link BedCombustionService}.
 */
@Injectable()
export class BedMarchService {
  constructor(
    private readonly gas: GasPropertiesService,
    private readonly transport: TransportService,
    private readonly diffusion: DiffusionService,
    private readonly aero: AerodynamicsService,
    private readonly wall: MultilayerWallService,
    private readonly kinetics: ChemicalKineticsService,
    private readonly equilibrium: ProductEquilibriumService,
    private readonly enthalpy: CombustionEnthalpyService,
  ) {}

  march(geo: BedGeometry, cond: BedConditions, inlet: GasStream, steam?: SteamInjection): MarchResult {
    const layers: LayerState[] = [];
    let flows = { ...inlet.flows };
    let T = inlet.T_K;
    for (let i = 0; i < geo.nLayers; i++) {
      const st = this.layer(i, geo, cond, flows, T, steam?.layer === i ? steam : undefined);
      layers.push(st);
      flows = st.flows;
      T = st.T_K;
    }
    const sum = (f: (l: LayerState) => number): number => layers.reduce((s, l) => s + f(l), 0);
    return {
      layers,
      outlet:          { flows, T_K: T },
      fuel_kgs:        sum(l => l.fuel_kgs),
      carbon_mols:     sum(l => l.carbon_mols),
      ash_kgs:         sum(l => l.ash_kgs),
      ashEnthalpy_W:   sum(l => l.ashEnthalpy_W),
      wallLoss_W:      sum(l => l.wallLoss_W),
      pressureDrop_Pa: sum(l => l.result.pressureDrop_Pa),
      steam:           sumFlows(...layers.map(l => l.steam)),
    };
  }

  private layer(
    i: number, geo: BedGeometry, cond: BedConditions, flowsIn: GasFlows, T_in: number, steam?: SteamInjection,
  ): LayerState {
    const { fuel, porosity } = cond;
    const V = geo.volume_m3;
    const grate = BED_KINETICS.PARTICLE_SIZE_GRATE_RATIO;
    const R_p = cond.particleSize_m * (grate + (1 - grate) * (i + 1) / geo.nLayers) / 2;
    const D_p = 2 * R_p;

    const y = moleFractions(flowsIn);
    const M = this.gas.molecularWeight(y);
    const rho = this.gas.density(M, T_in);
    const mGas = gasMassFlow(flowsIn);
    const v = this.aero.superficialVelocity(mGas, rho, geo.area_m2);
    const mu = this.transport.viscosityMix(y, T_in);
    const cpBySpecies: GasFlows = {};
    for (const sp of Object.keys(y) as Species[]) cpBySpecies[sp] = this.gas.cpSpecies(sp, T_in);
    const k = this.transport.thermalConductivityMix(y, T_in, cpBySpecies);
    const cpMass = this.gas.cpMixture(y, T_in) / M;
    const Re = rho * v * D_p / mu;
    const Pr = mu * cpMass / k;
    const h = specialNu.gunn(Re, Pr, porosity) * k / D_p;
    const dP = this.aero.pressureDrop({ v_m_s: v, D_p_m: D_p, epsilon: porosity, rho_kg_m3: rho, mu_Pa_s: mu }) * geo.dz_m;
    const Kp = this.equilibrium.wgsKp(T_in);
    const gasRates = this.kinetics.gasPhaseRates(y, T_in, Kp);

    const a_s = 3 * (1 - porosity) / R_p;
    const hAs = h * a_s * V;
    const evaluate = (Ts: number): { ext: ReactionExtents; q: number; D: EffectiveDiffusion } => {
      const D: EffectiveDiffusion = {
        O2:  this.diffusion.effectiveDiffusion(Species.O2,  y, Ts),
        CO2: this.diffusion.effectiveDiffusion(Species.CO2, y, Ts),
        H2O: this.diffusion.effectiveDiffusion(Species.H2O, y, Ts),
      };
      const s = this.kinetics.surfaceRates(y, T_in, Ts, cond, D, R_p);
      const raw: ReactionExtents = {
        r1: s.r1 * V, r2: s.r2 * V, r3: s.r3 * V, r31: s.r31 * V, r32: s.r32 * V, r33: s.r33 * V,
        r4: gasRates.r4 * V, r41: gasRates.r41 * V, r42: gasRates.r42 * V,
      };
      const ext = this.limitExtents(raw, flowsIn);
      return { ext, q: this.kinetics.surfaceHeatRelease_W(ext), D };
    };
    const Ts = this.solidTemperature(T_in, Ts_ => evaluate(Ts_).q / hAs);
    const { ext, D } = evaluate(Ts);

    // apply surface + oxidation extents, then the shift toward (not past) equilibrium
    let flows = this.applyExtents(flowsIn, ext);
    const r43 = this.shiftExtent(flows, gasRates.r43 * V, Kp);
    flows = sumFlows(flows, { [Species.CO]: -r43, [Species.H2O]: -r43, [Species.CO2]: r43, [Species.H2]: r43 });

    const carbon_mols = BED_REACTIONS.IDS.reduce((s, r) => s + (BED_REACTIONS.CARBON_PER_EXTENT[r] ?? 0) * ext[r], 0);
    const fuel_kgs = carbon_mols * ATOMIC_MASS.C / fuel.elementalComp.C;
    const el = elementsOfCondensed(fuel.elementalComp, fuel_kgs);
    flows = sumFlows(flows, this.volatiles(el));
    const ash_kgs = fuel_kgs * fuel.elementalComp.ash;
    const ashEnthalpy_W = this.enthalpy.ashEnthalpy_W(ash_kgs, Ts);

    const wall = this.wallLoss(geo, cond, y, mGas, v, T_in);

    let steamFlows: GasFlows = {};
    let target = this.enthalpy.gasEnthalpy_W(flowsIn, T_in)
      + this.enthalpy.condensedEnthalpy_W(fuel, fuel_kgs, cond.tFuel_K)
      - ashEnthalpy_W - wall.loss_W;
    if (steam) {
      steamFlows = { [Species.H2O]: totalMoles(flows) * steam.percent / 100 };
      flows = sumFlows(flows, steamFlows);
      target += this.enthalpy.gasEnthalpy_W(steamFlows, steam.T_K);
    }
    const T_out = this.gasTemperature(flows, target);

    const yOut = moleFractions(flows);
    const extents: ReactionExtentsDto = { ...ext, r43 };
    return {
      flows, T_K: T_out, fuel_kgs, carbon_mols, ash_kgs, ashEnthalpy_W, wallLoss_W: wall.loss_W, steam: steamFlows,
      result: {
        index: i,
        z_m: (i + 0.5) * geo.dz_m,
        tGas_K: T_out,
        tSolid_K: Ts,
        deltaT_K: T_out - T_in,
        moleFractions: toSpeciesValues(yOut),
        carbonBurnRate_kgs: carbon_mols * ATOMIC_MASS.C,
        fuelBurnRate_kgs: fuel_kgs,
        // external char surface in the layer = a_s·V [m²] → g/(s·cm²)
        burnRatePerArea_g_s_cm2: carbon_mols * ATOMIC_MASS.C * CHEMISTRY.GRAMS_PER_KILOGRAM / (a_s * V * UNIT_CONVERSION.CM2_PER_M2),
        extents,
        wallLoss_W: wall.loss_W,
        tWallInner_K: wall.tInner_K,
        tWallOuter_K: wall.tOuter_K,
        hConv_Wm2K: h,
        velocity_ms: v,
        pressureDrop_Pa: dP,
        D_O2_m2s: D.O2,
        D_CO2_m2s: D.CO2,
        D_H2O_m2s: D.H2O,
        steamInjected: !!steam,
      },
    };
  }

  /**
   * Largest root of F(T_s) = T_s − T_g − Δ(T_s) on [T_SOLID_MIN_RATIO·T_g, T_MAX_SOLID_K],
   * where Δ = q_surf/(h·a_s·V). The largest root is the ignited steady state.
   */
  private solidTemperature(T_gas: number, delta: (Ts: number) => number): number {
    const lo = Math.max(COMBUSTION.FLAME_T_MIN_K, BED_KINETICS.T_SOLID_MIN_RATIO * T_gas);
    const hi = BED_KINETICS.T_MAX_SOLID_K;
    const F = (Ts: number): number => Ts - T_gas - delta(Ts);
    if (F(hi) <= 0) return hi;
    let upper: number = hi;
    for (let T = hi - BED_KINETICS.SOLID_T_SCAN_STEP_K; ; T -= BED_KINETICS.SOLID_T_SCAN_STEP_K) {
      const Tc = Math.max(T, lo);
      if (F(Tc) <= 0) return brentq(F, Tc, upper, BED_KINETICS.SOLID_T_TOL_K).root;
      if (Tc === lo) return lo;
      upper = Tc;
    }
  }

  /** Scale extents so no inlet species is consumed beyond its available flow */
  private limitExtents(raw: ReactionExtents, available: GasFlows): ReactionExtents {
    const ext = { ...raw };
    for (const r of BED_REACTIONS.IDS) ext[r] = Math.max(0, ext[r]);
    for (let it = 0; it < BED_KINETICS.LIMITER_ITERATIONS; it++) {
      let changed = false;
      for (const sp of Object.keys(available) as Species[]) {
        const avail = (available[sp] ?? 0) * BED_KINETICS.MAX_CONSUMPTION_FRACTION;
        let use = 0;
        for (const r of BED_REACTIONS.IDS) use += Math.max(0, -(BED_REACTIONS.STOICH[r][sp] ?? 0)) * ext[r];
        if (use > avail * (1 + BED_KINETICS.LIMITER_REL_TOL) && use > 0) {
          const f = avail / use;
          for (const r of BED_REACTIONS.IDS) if ((BED_REACTIONS.STOICH[r][sp] ?? 0) < 0) ext[r] *= f;
          changed = true;
        }
      }
      // species absent from the inlet cannot be consumed at all
      for (const r of BED_REACTIONS.IDS) {
        for (const [sp, nu] of Object.entries(BED_REACTIONS.STOICH[r]) as [Species, number][]) {
          if (nu < 0 && !((available[sp] ?? 0) > 0) && ext[r] > 0) { ext[r] = 0; changed = true; }
        }
      }
      if (!changed) break;
    }
    return ext;
  }

  private applyExtents(flows: GasFlows, ext: ReactionExtents): GasFlows {
    const out: GasFlows = { ...flows };
    for (const r of BED_REACTIONS.IDS) {
      if (!ext[r]) continue;
      for (const [sp, nu] of Object.entries(BED_REACTIONS.STOICH[r]) as [Species, number][]) {
        out[sp] = (out[sp] ?? 0) + nu * ext[r];
      }
    }
    for (const sp of Object.keys(out) as Species[]) {
      if ((out[sp] ?? 0) < 0) out[sp] = 0; // round-off after exact limiting
    }
    return sumFlows(out);
  }

  /** Water-gas shift extent: kinetic value, not past the equilibrium extent of the current flows */
  private shiftExtent(flows: GasFlows, kinetic: number, Kp: number): number {
    const co = flows[Species.CO] ?? 0, h2o = flows[Species.H2O] ?? 0;
    const co2 = flows[Species.CO2] ?? 0, h2 = flows[Species.H2] ?? 0;
    const lo = -Math.min(co2, h2), hi = Math.min(co, h2o);
    if (!(hi > lo) || kinetic === 0) return 0;
    const f = (x: number): number => (co2 + x) * (h2 + x) - Kp * (co - x) * (h2o - x);
    const fl = f(lo), fh = f(hi);
    const xEq = fl >= 0 ? lo : fh <= 0 ? hi : brentq(f, lo, hi, BED_KINETICS.WGS_EXTENT_ABS_TOL + BED_KINETICS.WGS_EXTENT_REL_TOL * (hi - lo)).root;
    if (kinetic > 0) return xEq > 0 ? Math.min(kinetic, xEq) : 0;
    return xEq < 0 ? Math.max(kinetic, xEq) : 0;
  }

  /** Non-carbon elements of the consumed fuel released as H2O, H2, O2, N2 */
  private volatiles(el: ElementFlows): GasFlows {
    const h2o = Math.min(el.O, el.H / 2);
    return {
      [Species.H2O]: h2o,
      [Species.H2]:  (el.H - 2 * h2o) / 2,
      [Species.O2]:  (el.O - h2o) / 2,
      [Species.N2]:  el.N / 2,
    };
  }

  private gasTemperature(flows: GasFlows, target_W: number): number {
    const g = (T: number): number => this.enthalpy.gasEnthalpy_W(flows, T) - target_W;
    const lo = COMBUSTION.FLAME_T_MIN_K, hi = COMBUSTION.FLAME_T_MAX_K;
    if (g(lo) > 0) throw new UnprocessableEntityException(`Bed layer energy balance: gas temperature would be below ${lo} K`);
    if (g(hi) < 0) throw new UnprocessableEntityException(`Bed layer energy balance: gas temperature would exceed ${hi} K`);
    return brentq(g, lo, hi, BED_KINETICS.GAS_T_ROOT_TOL).root;
  }

  private wallLoss(
    geo: BedGeometry, cond: BedConditions, y: GasFlows, mGas: number, v: number, T_gas: number,
  ): { loss_W: number; tInner_K: number | null; tOuter_K: number | null } {
    if (!cond.wallLayers || T_gas <= cond.tAmbient_K + 1) return { loss_W: 0, tInner_K: null, tOuter_K: null };
    const r = this.wall.calculate({
      geometry: WallGeometry.CYLINDER,
      a_m: geo.diameter_m,
      b_m: geo.dz_m,
      layers: cond.wallLayers,
      w_ms: v,
      composition: BedSmoke.composition(y),
      mPerSecond_kgs: mGas,
      tFlame_K: T_gas,
      tAmbient_K: cond.tAmbient_K,
      innerEmissivity: cond.wallEmissivity,
    });
    return { loss_W: r.fluxInner_W, tInner_K: r.tInner_K, tOuter_K: r.tOuter_K };
  }

  // ── Post-processing ─────────────────────────────────────────────────────────

  maxCo2Layer(layers: LayerState[]): number {
    let best = 0;
    for (let i = 1; i < layers.length; i++) {
      if ((layers[i].result.moleFractions[Species.CO2] ?? 0) > (layers[best].result.moleFractions[Species.CO2] ?? 0)) best = i;
    }
    return best;
  }

  /** Highest layer with CO < 1 % and O2 > 1 % (legacy criterion) */
  oxidationZoneHeight(layers: LayerState[]): number | null {
    for (let i = layers.length - 1; i >= 0; i--) {
      const y = layers[i].result.moleFractions;
      if ((y[Species.CO] ?? 0) < BED_KINETICS.OXIDATION_ZONE_CO_MAX && (y[Species.O2] ?? 0) > BED_KINETICS.OXIDATION_ZONE_O2_MIN) return layers[i].result.z_m;
    }
    return null;
  }
}
