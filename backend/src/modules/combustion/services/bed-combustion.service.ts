import { BadRequestException, Injectable, UnprocessableEntityException } from '@nestjs/common';
import { Species } from '../../thermodynamics/enums';
import { GasPropertiesService } from '../../thermodynamics/services/gas-properties.service';
import { MultilayerWallService } from '../../thermal-exchange/services/multilayer-wall.service';
import { WallGeometry } from '../../thermal-exchange/enums/wall-geometry.enum';
import { PHYSICAL_CONSTANTS, UNIT_CONVERSION } from '../../../common/thermal/constants';
import { ATOMIC_MASS, BED_KINETICS, COMBUSTION } from '../constants';
import {
  BedConditions, BedGeometry, CondensedFuel, GasStream, ReactionStepOutcome,
} from '../types';
import { BedCombustionInputDto, BedCombustionResultDto, FurnaceWallDto } from '../dto/bed';
import { GasFlows } from '../types';
import { addElements, elementResidual, elementsOfCondensed, elementsOfGas, stoichiometricO2 } from '../utils/element-balance';
import { airFlows, gasMassFlow, moleFractions, totalMoles } from '../utils/gas-flows';
import { resolveCondensedFuel, summarizeCondensedFuel } from '../utils/fuel-resolver';
import { toSpeciesValues, toStepResult } from '../utils/step-result';
import { BedSmoke } from '../utils/bed-smoke';
import { CombustionEnthalpyService } from './combustion-enthalpy.service';
import { FlameSolverService } from './flame-solver.service';
import { BedMarchService } from './bed-march.service';

/**
 * Mode 4 — packed-bed generator by layers with chemical kinetics, then burnout with
 * secondary air (same as step 2 of mode 2).
 *
 * Layer physics live in {@link BedMarchService}; this service owns inputs, air, march
 * orchestration, and secondary-air burnout.
 */
@Injectable()
export class BedCombustionService {
  constructor(
    private readonly gas: GasPropertiesService,
    private readonly wall: MultilayerWallService,
    private readonly enthalpy: CombustionEnthalpyService,
    private readonly solver: FlameSolverService,
    private readonly marchSvc: BedMarchService,
  ) {}

  calculate(dto: BedCombustionInputDto): BedCombustionResultDto {
    const fuel = resolveCondensedFuel(dto.fuelId, dto.fuel);
    const cond = this.conditions(dto, fuel);
    const pO2   = dto.pO2   ?? COMBUSTION.DEFAULT_PO2;
    const wH2Om = dto.wH2Om ?? COMBUSTION.DEFAULT_W_H2OM;
    const tAir_K = dto.tAirPrimary_K;

    const { diameter_m, nLayers } = dto;
    const area_m2 = Math.PI * diameter_m ** 2 / 4;
    const dz_m = dto.bedHeight_m / nLayers;
    const geo: BedGeometry = { diameter_m, area_m2, dz_m, volume_m3: area_m2 * dz_m, nLayers };

    const air = this.primaryAir(dto, pO2, wH2Om, tAir_K);
    const airO2_mols = air[Species.O2] ?? 0;

    let march = this.marchSvc.march(geo, cond, { flows: air, T_K: tAir_K });
    const steamPercent = dto.steamInjectionPercent ?? 0;
    if (steamPercent > 0 && dto.steamT_K === undefined) throw new BadRequestException('`steamT_K` is required with steam injection');
    if (steamPercent > 0) {
      const layer = this.marchSvc.maxCo2Layer(march.layers);
      march = this.marchSvc.march(geo, cond, { flows: air, T_K: tAir_K }, { layer, percent: steamPercent, T_K: dto.steamT_K });
    }
    if (!(march.fuel_kgs > 0)) {
      throw new UnprocessableEntityException('The bed does not burn: no fuel is consumed under these conditions');
    }

    const burnedEl = elementsOfCondensed(fuel.elementalComp, march.fuel_kgs);
    const o2StoichBurned = stoichiometricO2(burnedEl);
    const secondary = this.secondaryAir(dto, o2StoichBurned, airO2_mols, pO2, wH2Om);
    const burnout = this.burnout(
      march.outlet, { flows: secondary, T_K: dto.tAirSecondary_K ?? tAir_K }, dto.furnace, dto.furnaceHeatLoss_W, cond.tAmbient_K,
    );

    const steamEnthalpy_W = march.layers.reduce(
      (s, l) => s + this.enthalpy.gasEnthalpy_W(l.steam, dto.steamT_K), 0,
    );
    const energyResidual_W = this.enthalpy.gasEnthalpy_W(air, tAir_K) + steamEnthalpy_W
      + this.enthalpy.condensedEnthalpy_W(fuel, march.fuel_kgs, cond.tFuel_K)
      - march.ashEnthalpy_W - march.wallLoss_W
      - this.enthalpy.gasEnthalpy_W(march.outlet.flows, march.outlet.T_K);
    const elIn = addElements(addElements(elementsOfGas(air).elements, elementsOfGas(march.steam).elements), burnedEl);
    const outletY = moleFractions(march.outlet.flows);
    const lhv = this.enthalpy.fuelLhv_Jkg(fuel);

    return {
      fuel:                  summarizeCondensedFuel(fuel, pO2, this.enthalpy),
      layers:                march.layers.map(l => l.result),
      mFuel_kgs:             march.fuel_kgs,
      fPower_W:              march.fuel_kgs * lhv,
      carbonBurnRate_kgs:    march.carbon_mols * ATOMIC_MASS.C,
      ash_kgs:               march.ash_kgs,
      mAirPrimary_kgs:       gasMassFlow(air),
      mSteam_kgs:            gasMassFlow(march.steam),
      mAirSecondary_kgs:     gasMassFlow(secondary),
      primaryExcessAir:      o2StoichBurned > 0 ? airO2_mols / o2StoichBurned : Infinity,
      generatorHeatLoss_W:   march.wallLoss_W,
      pressureDrop_Pa:       march.pressureDrop_Pa,
      oxidationZoneHeight_m: this.marchSvc.oxidationZoneHeight(march.layers),
      tStep1_K:              march.outlet.T_K,
      generatorGasMoleFlows_mols: toSpeciesValues(march.outlet.flows),
      generatorGasMoleFractions:  toSpeciesValues(outletY),
      mGeneratorGas_kgs:     gasMassFlow(march.outlet.flows),
      elementBalanceResidual: elementResidual(elIn, elementsOfGas(march.outlet.flows).elements),
      energyBalanceResidual_W: energyResidual_W,
      tFlame_K:              burnout.T_K,
      burnout:               toStepResult(burnout),
    };
  }

  // ── Inputs ──────────────────────────────────────────────────────────────────

  private conditions(dto: BedCombustionInputDto, fuel: CondensedFuel): BedConditions {
    const { porosity, particleSize_m, activityFactor } = fuel;
    if (porosity === undefined || particleSize_m === undefined || activityFactor === undefined) {
      throw new BadRequestException('Bed model needs fuel `porosity`, `particleSize_m` and `activityFactor`');
    }
    if (!(porosity > 0 && porosity < 1)) throw new BadRequestException('Fuel porosity must be in (0, 1)');
    if ((fuel.elementalComp.S ?? 0) > 0) {
      throw new BadRequestException('Bed kinetics has no sulphur chemistry; use a sulphur-free fuel');
    }
    if (!(fuel.elementalComp.C > 0)) throw new BadRequestException('Bed model needs a carbon-containing fuel');
    const wallLayers = dto.generatorWallLayers?.length ? dto.generatorWallLayers : undefined;
    if (wallLayers && dto.generatorWallEmissivity === undefined) {
      throw new BadRequestException('`generatorWallEmissivity` is required with `generatorWallLayers`');
    }
    if ((wallLayers || dto.furnace) && dto.tAmbient_K === undefined) {
      throw new BadRequestException('`tAmbient_K` is required with `generatorWallLayers` or `furnace`');
    }
    return {
      fuel, porosity, particleSize_m, activityFactor,
      tFuel_K:    dto.tFuel_K ?? COMBUSTION.T_REF_K,
      tAmbient_K: dto.tAmbient_K,
      wallLayers,
      wallEmissivity: dto.generatorWallEmissivity,
    };
  }

  private primaryAir(dto: BedCombustionInputDto, pO2: number, wH2Om: number, tAir_K: number): GasFlows {
    if ((dto.mAirPrimary_kgs === undefined) === (dto.airFlow_m3h === undefined)) {
      throw new BadRequestException('Specify exactly one of `mAirPrimary_kgs` or `airFlow_m3h`');
    }
    const perO2 = airFlows(1, pO2, wH2Om);
    let o2_mols: number;
    if (dto.mAirPrimary_kgs !== undefined) {
      o2_mols = dto.mAirPrimary_kgs / gasMassFlow(perO2);
    } else {
      const q_m3s = dto.airFlow_m3h / UNIT_CONVERSION.SECONDS_PER_HOUR;
      o2_mols = (COMBUSTION.ATMOSPHERIC_PRESSURE_PA * q_m3s / (PHYSICAL_CONSTANTS.GAS_CONSTANT_J_MOLK * tAir_K)) / totalMoles(perO2);
    }
    if (!(o2_mols > 0)) throw new BadRequestException('Primary air flow must be positive');
    return airFlows(o2_mols, pO2, wH2Om);
  }

  private secondaryAir(
    dto: BedCombustionInputDto, o2StoichBurned: number, primaryO2_mols: number, pO2: number, wH2Om: number,
  ): GasFlows {
    if (dto.kExcessAir !== undefined && dto.mAirSecondary_kgs !== undefined) {
      throw new BadRequestException('Specify at most one of `kExcessAir` or `mAirSecondary_kgs`');
    }
    let o2_mols = 0;
    if (dto.mAirSecondary_kgs !== undefined) {
      o2_mols = dto.mAirSecondary_kgs / gasMassFlow(airFlows(1, pO2, wH2Om));
    } else if (dto.kExcessAir !== undefined) {
      o2_mols = Math.max(0, dto.kExcessAir * o2StoichBurned - primaryO2_mols);
    }
    return airFlows(o2_mols, pO2, wH2Om);
  }

  private burnout(
    genGas: GasStream, air: GasStream, furnace: FurnaceWallDto | undefined, fixedLoss_W: number | undefined, tAmbient_K: number,
  ): ReactionStepOutcome {
    if (furnace && fixedLoss_W !== undefined) {
      throw new BadRequestException('Specify at most one of `furnace` or `furnaceHeatLoss_W`');
    }
    if (!furnace) return this.solver.burnGasStream(genGas, air, fixedLoss_W ?? 0);

    const area = Math.PI * furnace.diameter_m ** 2 / 4;
    let Q = 0;
    let step = this.solver.burnGasStream(genGas, air, Q);
    for (let it = 0; it < BED_KINETICS.FURNACE_ITERATIONS; it++) {
      if (step.T_K <= tAmbient_K + 1) break;
      const y = moleFractions(step.products.gas);
      const mGas = gasMassFlow(step.products.gas);
      const rho = this.gas.density(this.gas.molecularWeight(y), step.T_K);
      const wall = this.wall.calculate({
        geometry: WallGeometry.CYLINDER,
        a_m: furnace.diameter_m,
        b_m: furnace.length_m,
        layers: furnace.wallLayers,
        w_ms: mGas / (rho * area),
        composition: BedSmoke.composition(y),
        mPerSecond_kgs: mGas,
        tFlame_K: step.T_K,
        tAmbient_K,
        innerEmissivity: furnace.emissivity,
      });
      const Qnext = Q + BED_KINETICS.FURNACE_DAMPING * (wall.fluxInner_W - Q);
      const next = this.solver.burnGasStream(genGas, air, Qnext);
      const converged = Math.abs(next.T_K - step.T_K) < BED_KINETICS.FURNACE_TOL_K;
      Q = Qnext;
      step = next;
      if (converged) break;
    }
    return step;
  }

}
