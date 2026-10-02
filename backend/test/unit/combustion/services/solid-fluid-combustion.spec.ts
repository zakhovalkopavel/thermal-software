import { GasPropertiesService } from '../../../../src/modules/thermodynamics/services/gas-properties.service';
import { CombustionEnthalpyService } from '../../../../src/modules/combustion/services/combustion-enthalpy.service';
import { ProductEquilibriumService } from '../../../../src/modules/combustion/services/product-equilibrium.service';
import { FlameSolverService } from '../../../../src/modules/combustion/services/flame-solver.service';
import { SolidCombustionService } from '../../../../src/modules/combustion/services/solid-combustion.service';
import { FluidCombustionService } from '../../../../src/modules/combustion/services/fluid-combustion.service';
import { FuelId } from '../../../../src/modules/combustion/enums/fuel-id.enum';
import { FuelPhase } from '../../../../src/modules/combustion/enums/fuel-phase.enum';
import { CombustionStepResultDto } from '../../../../src/modules/combustion/dto/common';
import { CHARCOAL_BRIQUETTE } from '../../../../src/modules/combustion/data/fuels';
import { ATOMIC_MASS } from '../../../../src/modules/combustion/constants';

describe('Solid and fluid combustion (modes 1–3)', () => {
  const gas = new GasPropertiesService();
  const enthalpy = new CombustionEnthalpyService(gas);
  const equilibrium = new ProductEquilibriumService(gas);
  const solver = new FlameSolverService(enthalpy, equilibrium);
  const solid = new SolidCombustionService(enthalpy, solver);
  const fluid = new FluidCombustionService(enthalpy, solver);

  const energyResidual_K = (s: CombustionStepResultDto): number =>
    Math.abs(s.productEnthalpy_W + s.heatLoss_W - s.reactantEnthalpy_W) / (s.mGas_kgs * 1000);

  const ashFreeFuel = {
    name: 'Ash-free char',
    elementalComp: { C: 0.86, H: 0.03, O: 0.10, N: 0.01, ash: 0 },
    lhv_J_kg: 30_000_000,
    specificHeat_J_kgK: 1100,
  };

  // Briquette analysis with the legacy recuperator fuelQ (30 MJ/kg) as LHV; with the preset's
  // verified ΔHf = −8.5 MJ/kg, gasification C → CO is endothermic and the generator runs cold
  const charcoalLhv = {
    name: 'Charcoal (LHV 30 MJ/kg)',
    elementalComp: { ...CHARCOAL_BRIQUETTE.elementalComp },
    lhv_J_kg: 30_000_000,
    specificHeat_J_kgK: 1100,
  };

  describe('mode 1 — solid direct', () => {
    const base = { fuelId: FuelId.CharcoalBriquette, mFuel_kgs: 0.001, kExcessAir: 1.2, tAir_K: 293 };

    it('lean: complete combustion, balances close', () => {
      const r = solid.direct(base);
      const c = r.combustion;
      expect(c.excessAir).toBeCloseTo(1.2, 9);
      expect(c.products.moleFlows_mols.CO).toBe(0);
      expect(c.products.moleFlows_mols.H2).toBe(0);
      expect(c.products.moleFlows_mols.O2).toBeGreaterThan(0);
      expect(c.elementBalanceResidual).toBeLessThan(1e-9);
      expect(energyResidual_K(c)).toBeLessThan(0.01);
      expect(r.tFlame_K).toBeGreaterThan(1500);
      expect(r.tFlame_K).toBeLessThan(2500);
      expect(r.mAir_kgs / r.mFuel_kgs).toBeCloseTo(1.2 * r.fuel.stoichAir_kgkg, 6);
    });

    it('mass balance: fuel + air = gas + ash + char', () => {
      const r = solid.direct(base);
      const c = r.combustion;
      expect(c.mGas_kgs + c.ash_kgs + c.charCarbon_kgs).toBeCloseTo(r.mFuel_kgs + r.mAir_kgs, 12);
    });

    it('rich: no O2, CO and H2 present, WGS equilibrium at T_flame', () => {
      const r = solid.direct({ ...base, kExcessAir: 0.8 });
      const n = r.combustion.products.moleFlows_mols;
      expect(n.O2).toBe(0);
      expect(n.CO).toBeGreaterThan(0);
      expect(n.H2).toBeGreaterThan(0);
      const Q = (n.CO2 * n.H2) / (n.CO * n.H2O);
      expect(Q / r.combustion.wgsKp!).toBeCloseTo(1, 6);
      expect(r.combustion.wgsKp).toBeCloseTo(equilibrium.wgsKp(r.tFlame_K), 10);
    });

    it('very rich: unburned char', () => {
      const r = solid.direct({ fuel: charcoalLhv, mFuel_kgs: 0.001, kExcessAir: 0.3, tAir_K: 293 });
      expect(r.combustion.charCarbon_kgs).toBeGreaterThan(0);
      expect(r.combustion.charCarbon_kgs).toBeLessThan(0.001 * 0.85);
    });

    it('fPower gives mFuel = P / LHV', () => {
      const r = solid.direct({ fuelId: FuelId.CharcoalBriquette, fPower_W: 20_000, kExcessAir: 1.2, tAir_K: 293 });
      expect(r.mFuel_kgs).toBeCloseTo(20_000 / r.fuel.lhv_Jkg, 12);
      expect(r.fPower_W).toBeCloseTo(20_000, 6);
    });

    it('heat loss lowers and air preheat raises the flame temperature', () => {
      const t0 = solid.direct(base).tFlame_K;
      expect(solid.direct({ ...base, heatLoss_W: 5_000 }).tFlame_K).toBeLessThan(t0);
      expect(solid.direct({ ...base, tAir_K: 773 }).tFlame_K).toBeGreaterThan(t0);
    });

    it('stoichiometric flame is hotter than lean and rich', () => {
      const t1 = solid.direct({ ...base, kExcessAir: 1 }).tFlame_K;
      expect(solid.direct({ ...base, kExcessAir: 1.4 }).tFlame_K).toBeLessThan(t1);
      expect(solid.direct({ ...base, kExcessAir: 0.7 }).tFlame_K).toBeLessThan(t1);
    });

    it('rejects ambiguous fuel / flow selection', () => {
      expect(() => solid.direct({ ...base, fuel: ashFreeFuel })).toThrow();
      expect(() => solid.direct({ fuelId: FuelId.CharcoalBriquette, kExcessAir: 1, tAir_K: 293 })).toThrow();
      expect(() => solid.direct({
        fuel: { ...ashFreeFuel, elementalComp: { ...ashFreeFuel.elementalComp, C: 0.5 } },
        mFuel_kgs: 0.001, kExcessAir: 1, tAir_K: 293,
      })).toThrow();
    });
  });

  describe('mode 2 — solid two-step', () => {
    const base = {
      fuel: charcoalLhv, mFuel_kgs: 0.001, kExcessAir: 1.2,
      tAirPrimary_K: 293, tAirSecondary_K: 293,
    };

    it('default primary air takes C to CO: generator gas has CO, no CO2, no O2, no char', () => {
      const r = solid.twoStep(base);
      const g = r.generator.products.moleFlows_mols;
      expect(g.CO).toBeGreaterThan(0);
      expect(g.CO2).toBeCloseTo(0, 12);
      expect(g.O2).toBe(0);
      expect(r.generator.charCarbon_kgs).toBeCloseTo(0, 12);
      expect(r.primaryExcessAir).toBeGreaterThan(0.3);
      expect(r.primaryExcessAir).toBeLessThan(0.6);
      expect(r.tStep1_K).toBeGreaterThan(293);
    });

    it('elements and energy balance close over both steps', () => {
      const r = solid.twoStep(base);
      expect(r.generator.elementBalanceResidual).toBeLessThan(1e-9);
      expect(r.burnout.elementBalanceResidual).toBeLessThan(1e-9);
      expect(energyResidual_K(r.generator)).toBeLessThan(0.01);
      expect(energyResidual_K(r.burnout)).toBeLessThan(0.01);
      const mIn = r.mFuel_kgs + r.mAirPrimary_kgs + r.mAirSecondary_kgs;
      const mOut = r.burnout.mGas_kgs + r.generator.ash_kgs + r.generator.charCarbon_kgs;
      expect(mOut).toBeCloseTo(mIn, 12);
      expect(r.burnout.products.moleFlows_mols.CO).toBe(0);
    });

    it('adiabatic ash-free two-step equals one-step (Hess)', () => {
      const common = { fuel: ashFreeFuel, mFuel_kgs: 0.001, kExcessAir: 1.2 };
      const one = solid.direct({ ...common, tAir_K: 400 });
      const two = solid.twoStep({ ...common, tAirPrimary_K: 400, tAirSecondary_K: 400 });
      expect(two.tFlame_K).toBeCloseTo(one.tFlame_K, 3);
    });

    it('generator loss lowers T_step1 and T_flame; flux × surface equals explicit loss', () => {
      const r0 = solid.twoStep(base);
      const r1 = solid.twoStep({ ...base, generatorHeatFlux_Wm2: 7000, generatorSurface_m2: 0.2 });
      const r2 = solid.twoStep({ ...base, generatorHeatLoss_W: 1400 });
      expect(r1.tStep1_K).toBeLessThan(r0.tStep1_K);
      expect(r1.tFlame_K).toBeLessThan(r0.tFlame_K);
      expect(r1.generator.heatLoss_W).toBeCloseTo(1400, 9);
      expect(r2.tFlame_K).toBeCloseTo(r1.tFlame_K, 9);
    });

    it('zero secondary air keeps the generator state', () => {
      const r = solid.twoStep({ ...base, kExcessAir: 0.45, primaryExcessAir: 0.45 });
      expect(r.mAirSecondary_kgs).toBe(0);
      expect(Math.abs(r.tFlame_K - r.tStep1_K)).toBeLessThan(0.01);
    });

    it('generator loss larger than the heat release is reported, not silently clamped', () => {
      expect(() => solid.twoStep({ ...base, generatorHeatLoss_W: 1e6 })).toThrow(/too low/);
    });

    it('burnout step equals mode 3 fed with the same gas', () => {
      const r = solid.twoStep({ ...base, tAirSecondary_K: 573 });
      const m3 = fluid.calculate({
        phase: FuelPhase.Gas,
        fuelGas: r.generator.products.moleFractions,
        mFuel_kgs: r.generator.mGas_kgs,
        kExcessAir: r.burnout.excessAir,
        tAir_K: 573,
        tFuel_K: r.tStep1_K,
      });
      expect(m3.tFlame_K).toBeCloseTo(r.tFlame_K, 4);
    });

    it('rejects primary air above total air', () => {
      expect(() => solid.twoStep({ ...base, primaryExcessAir: 1.5 })).toThrow();
    });
  });

  describe('mode 3 — fluid fuel', () => {
    it('methane / air λ = 1 at 298 K: adiabatic flame without dissociation ≈ 2320 K', () => {
      const r = fluid.calculate({ phase: FuelPhase.Gas, fuelGas: { CH4: 1 }, mFuel_kgs: 0.001, kExcessAir: 1, tAir_K: 298.15 });
      expect(r.tFlame_K).toBeGreaterThan(2250);
      expect(r.tFlame_K).toBeLessThan(2400);
      expect(r.fuel.lhv_Jkg / 1e6).toBeCloseTo(50.0, 0);
      expect(r.fuel.stoichAir_kgkg).toBeCloseTo(17.1, 0);
      expect(r.combustion.elementBalanceResidual).toBeLessThan(1e-9);
      expect(energyResidual_K(r.combustion)).toBeLessThan(0.01);
    });

    it('fuel gas mole fractions are normalised; inert argon passes through', () => {
      const r = fluid.calculate({
        phase: FuelPhase.Gas, fuelGas: { CH4: 9, Ar: 1 }, fPower_W: 10_000, kExcessAir: 1.1, tAir_K: 293,
      });
      expect(r.combustion.products.moleFlows_mols.Ar).toBeGreaterThan(0);
      expect(r.fPower_W).toBeCloseTo(10_000, 6);
    });

    it('liquid fuel from elemental analysis and LHV', () => {
      const r = fluid.calculate({
        phase: FuelPhase.Liquid,
        fuel: { elementalComp: { C: 0.86, H: 0.135, O: 0, N: 0, S: 0.005, ash: 0 }, lhv_J_kg: 42_500_000 },
        mFuel_kgs: 0.001, kExcessAir: 1.2, tAir_K: 293,
      });
      expect(r.fuel.lhv_Jkg).toBe(42_500_000);
      expect(r.combustion.products.moleFlows_mols.SO2).toBeCloseTo(0.001 * 0.005 / ATOMIC_MASS.S, 12);
      expect(r.tFlame_K).toBeGreaterThan(1900);
      expect(r.tFlame_K).toBeLessThan(2300);
    });

    it('rejects unknown species and missing inputs', () => {
      expect(() => fluid.calculate({ phase: FuelPhase.Gas, fuelGas: { XY: 1 }, mFuel_kgs: 1, kExcessAir: 1, tAir_K: 293 })).toThrow();
      expect(() => fluid.calculate({ phase: FuelPhase.Liquid, mFuel_kgs: 1, kExcessAir: 1, tAir_K: 293 })).toThrow();
      expect(() => fluid.calculate({ phase: FuelPhase.Gas, fuelGas: { N2: 1 }, mFuel_kgs: 1, kExcessAir: 1, tAir_K: 293 })).toThrow();
    });
  });

  it('charcoal preset is used unchanged by the solid model', () => {
    const r = solid.direct({ fuelId: FuelId.CharcoalBriquette, mFuel_kgs: 1, kExcessAir: 1.2, tAir_K: 293 });
    expect(r.fuel.heatOfFormation_Jkg).toBe(CHARCOAL_BRIQUETTE.heatOfFormation_J_kg);
    expect(r.combustion.ash_kgs).toBeCloseTo(0.01, 12);
  });
});
