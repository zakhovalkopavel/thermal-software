import { BadRequestException, Injectable } from '@nestjs/common';
import { SolidDirectInputDto, SolidDirectResultDto } from '../dto/solid-direct.dto';
import { SolidTwoStepInputDto, SolidTwoStepResultDto } from '../dto/solid-two-step.dto';
import { FluidFuelInputDto, FluidFuelResultDto } from '../dto/fluid-fuel.dto';
import { BedCombustionInputDto, BedCombustionResultDto } from '../dto/bed-combustion.dto';
import { CombustionModeInputDto } from '../dto/combustion-mode-input.dto';
import { FuelSummaryDto } from '../dto/condensed-fuel.dto';
import { BED_KINETICS, COMBUSTION } from '../constants/combustion.constants';
import { FUEL_REGISTRY } from '../data/fuels';
import { FuelPhase } from '../data/fuels/fuel.interface';
import { CombustionMode } from '../enums/combustion-mode.enum';
import { FlueGas } from '../interfaces/combustion-streams.interface';
import { resolveFuelGas, summarizeCondensedFuel, summarizeGaseousFuel } from '../utils/fuel-resolver.util';
import { CombustionEnthalpyService } from './combustion-enthalpy.service';
import { SolidCombustionService } from './solid-combustion.service';
import { FluidCombustionService } from './fluid-combustion.service';
import { BedCombustionService } from './bed-combustion.service';

const MODE_INPUT: Record<CombustionMode, keyof Omit<CombustionModeInputDto, 'mode'>> = {
  [CombustionMode.SolidDirect]:  'solidDirect',
  [CombustionMode.SolidTwoStep]: 'solidTwoStep',
  [CombustionMode.Fluid]:        'fluid',
  [CombustionMode.Bed]:          'bed',
};

/** Combustion facade: the four modes, fuel presets and the flue gas of a selected mode */
@Injectable()
export class CombustionService {
  constructor(
    private readonly enthalpy: CombustionEnthalpyService,
    private readonly solid: SolidCombustionService,
    private readonly fluid: FluidCombustionService,
    private readonly bed: BedCombustionService,
  ) {}

  solidDirect(dto: SolidDirectInputDto): SolidDirectResultDto {
    return this.solid.direct(dto);
  }

  solidTwoStep(dto: SolidTwoStepInputDto): SolidTwoStepResultDto {
    return this.solid.twoStep(dto);
  }

  fluidFuel(dto: FluidFuelInputDto): FluidFuelResultDto {
    return this.fluid.calculate(dto);
  }

  bedCombustion(dto: BedCombustionInputDto): BedCombustionResultDto {
    return this.bed.calculate(dto);
  }

  /**
   * Flue gas of the selected mode. `airPreheat_K` is added to every combustion air temperature
   * of the mode input (primary and, when given, secondary).
   */
  flueGas(input: CombustionModeInputDto, airPreheat_K = 0): FlueGas {
    const key = MODE_INPUT[input.mode];
    if (!input[key]) throw new BadRequestException(`Combustion mode \`${input.mode}\` needs \`${key}\``);
    const extra = Object.values(MODE_INPUT).filter(k => k !== key && input[k] !== undefined);
    if (extra.length) throw new BadRequestException(`Give only \`${key}\` for mode \`${input.mode}\` (also got ${extra.join(', ')})`);

    const dT = airPreheat_K;
    const shift = (T?: number): number | undefined => (T === undefined ? undefined : T + dT);

    switch (input.mode) {
      case CombustionMode.SolidDirect: {
        const dto = input.solidDirect!;
        const r = this.solid.direct({ ...dto, tAir_K: dto.tAir_K + dT });
        return flueGasOf(input.mode, r.tFlame_K, r.mFuel_kgs, r.fPower_W, r.mAir_kgs, r.combustion, dto.pO2);
      }
      case CombustionMode.SolidTwoStep: {
        const dto = input.solidTwoStep!;
        const r = this.solid.twoStep({ ...dto, tAirPrimary_K: dto.tAirPrimary_K + dT, tAirSecondary_K: shift(dto.tAirSecondary_K) });
        return flueGasOf(input.mode, r.tFlame_K, r.mFuel_kgs, r.fPower_W, r.mAirPrimary_kgs + r.mAirSecondary_kgs, r.burnout, dto.pO2);
      }
      case CombustionMode.Fluid: {
        const dto = input.fluid!;
        const r = this.fluid.calculate({ ...dto, tAir_K: dto.tAir_K + dT });
        return flueGasOf(input.mode, r.tFlame_K, r.mFuel_kgs, r.fPower_W, r.mAir_kgs, r.combustion, dto.pO2);
      }
      case CombustionMode.Bed: {
        const dto = input.bed!;
        const r = this.bed.calculate({
          ...dto,
          tAirPrimary_K:   (dto.tAirPrimary_K ?? BED_KINETICS.AIR_T_DEFAULT_K) + dT,
          tAirSecondary_K: shift(dto.tAirSecondary_K),
        });
        return flueGasOf(input.mode, r.tFlame_K, r.mFuel_kgs, r.fPower_W, r.mAirPrimary_kgs + r.mAirSecondary_kgs, r.burnout, dto.pO2);
      }
    }
  }

  /** Preset fuels with derived LHV, ΔHf and stoichiometric air (dry air, 21 % O₂) */
  fuels(): FuelSummaryDto[] {
    const pO2 = COMBUSTION.DEFAULT_PO2;
    return Object.values(FUEL_REGISTRY).map(f => f.phase === FuelPhase.Gas
      ? summarizeGaseousFuel(f.id, f.name, resolveFuelGas(f.moleFractions), pO2, this.enthalpy)
      : summarizeCondensedFuel(f, pO2, this.enthalpy));
  }
}

function flueGasOf(
  mode: CombustionMode, tFlame_K: number, mFuel_kgs: number, fPower_W: number, mAir_kgs: number,
  lastStep: { mGas_kgs: number; products: { moleFractions: Record<string, number> } }, pO2?: number,
): FlueGas {
  return {
    mode, tFlame_K, mFuel_kgs, fPower_W, mAir_kgs,
    mFlueGas_kgs:  lastStep.mGas_kgs,
    moleFractions: lastStep.products.moleFractions,
    pO2: pO2 ?? COMBUSTION.DEFAULT_PO2,
  };
}
