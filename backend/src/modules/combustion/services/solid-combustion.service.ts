import { BadRequestException, Injectable } from '@nestjs/common';
import { COMBUSTION } from '../constants';
import { SolidDirectInputDto, SolidDirectResultDto } from '../dto/solid-direct';
import { SolidTwoStepInputDto, SolidTwoStepResultDto } from '../dto/solid-two-step';
import { airFlows, gasMassFlow } from '../utils/gas-flows';
import { elementsOfCondensed, stoichiometricO2 } from '../utils/element-balance';
import { resolveCondensedFuel, resolveFuelFlow, summarizeCondensedFuel } from '../utils/fuel-resolver';
import { toStepResult } from '../utils/step-result';
import { CombustionEnthalpyService } from './combustion-enthalpy.service';
import { FlameSolverService } from './flame-solver.service';

/**
 * Solid fuel combustion — simplified (equilibrium) models.
 *
 * Mode 1 (direct):   fuel + air(λ, T_air) → products at T_flame
 * Mode 2 (two-step): fuel + primary air → generator gas at T_step1 (generator wall loss),
 *                    generator gas + secondary air(T_air2) → products at T_flame (furnace loss)
 */
@Injectable()
export class SolidCombustionService {
  constructor(
    private readonly enthalpy: CombustionEnthalpyService,
    private readonly solver: FlameSolverService,
  ) {}

  direct(dto: SolidDirectInputDto): SolidDirectResultDto {
    const fuel  = resolveCondensedFuel(dto.fuelId, dto.fuel);
    const pO2   = dto.pO2   ?? COMBUSTION.DEFAULT_PO2;
    const wH2Om = dto.wH2Om ?? COMBUSTION.DEFAULT_W_H2OM;
    const lhv   = this.enthalpy.fuelLhv_Jkg(fuel);
    const mFuel_kgs = resolveFuelFlow(dto.mFuel_kgs, dto.fPower_W, lhv);

    const { outcome, air } = this.solver.burnCondensed({
      fuel, mFuel_kgs,
      tFuel_K: dto.tFuel_K ?? COMBUSTION.T_REF_K,
      kExcessAir: dto.kExcessAir, tAir_K: dto.tAir_K, pO2, wH2Om,
      heatLoss_W: dto.heatLoss_W,
    });

    return {
      fuel:      summarizeCondensedFuel(fuel, pO2, this.enthalpy),
      mFuel_kgs,
      fPower_W:  mFuel_kgs * lhv,
      mAir_kgs:  gasMassFlow(air),
      tFlame_K:  outcome.T_K,
      combustion: toStepResult(outcome),
    };
  }

  twoStep(dto: SolidTwoStepInputDto): SolidTwoStepResultDto {
    const fuel  = resolveCondensedFuel(dto.fuelId, dto.fuel);
    const pO2   = dto.pO2   ?? COMBUSTION.DEFAULT_PO2;
    const wH2Om = dto.wH2Om ?? COMBUSTION.DEFAULT_W_H2OM;
    const tFuel_K = dto.tFuel_K ?? COMBUSTION.T_REF_K;
    const lhv   = this.enthalpy.fuelLhv_Jkg(fuel);
    const mFuel_kgs = resolveFuelFlow(dto.mFuel_kgs, dto.fPower_W, lhv);

    const el = elementsOfCondensed(fuel.elementalComp, mFuel_kgs);
    const o2Stoich = stoichiometricO2(el);
    if (!(o2Stoich > 0)) throw new BadRequestException('Fuel has no oxygen demand');

    // Air that takes all C to CO (O/C = 1 after S → SO2), net of the fuel's own oxygen
    const o2ToCO = Math.max(0, (el.C + 2 * el.S - el.O) / 2);
    const primaryExcessAir = dto.primaryExcessAir ?? o2ToCO / o2Stoich;
    if (primaryExcessAir > dto.kExcessAir) {
      throw new BadRequestException(
        `Primary excess air (${primaryExcessAir.toFixed(3)}) exceeds total excess air (${dto.kExcessAir})`,
      );
    }

    const primary   = airFlows(primaryExcessAir * o2Stoich, pO2, wH2Om);
    const secondary = airFlows((dto.kExcessAir - primaryExcessAir) * o2Stoich, pO2, wH2Om);
    const generatorLoss_W = dto.generatorHeatLoss_W
      ?? (dto.generatorHeatFlux_Wm2 ?? 0) * (dto.generatorSurface_m2 ?? 0);

    const step1 = this.solver.solveStep({
      condensed:  { fuel, m_kgs: mFuel_kgs, T_K: tFuel_K },
      gasStreams: [{ flows: primary, T_K: dto.tAirPrimary_K }],
      heatLoss_W: generatorLoss_W,
    });

    const step2 = this.solver.burnGasStream(
      { flows: step1.products.gas, T_K: step1.T_K },
      { flows: secondary, T_K: dto.tAirSecondary_K ?? dto.tAirPrimary_K },
      dto.furnaceHeatLoss_W ?? 0,
    );

    return {
      fuel:              summarizeCondensedFuel(fuel, pO2, this.enthalpy),
      mFuel_kgs,
      fPower_W:          mFuel_kgs * lhv,
      primaryExcessAir,
      mAirPrimary_kgs:   gasMassFlow(primary),
      mAirSecondary_kgs: gasMassFlow(secondary),
      tStep1_K:          step1.T_K,
      tFlame_K:          step2.T_K,
      generator:         toStepResult(step1),
      burnout:           toStepResult(step2),
    };
  }
}
