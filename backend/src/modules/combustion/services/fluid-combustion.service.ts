import { BadRequestException, Injectable } from '@nestjs/common';
import { COMBUSTION } from '../constants/combustion.constants';
import { FuelPhase } from '../data/fuels/fuel.interface';
import { FluidFuelInputDto, FluidFuelResultDto } from '../dto/fluid-fuel.dto';
import {
  airFlows, elementsOfGas, gasMassFlow, scaleFlows, stoichiometricO2,
} from '../utils/element-balance.util';
import {
  resolveCondensedFuel, resolveFuelFlow, resolveGaseousFuel, summarizeCondensedFuel, summarizeGaseousFuel,
} from '../utils/fuel-resolver.util';
import { toStepResult } from '../utils/step-result.mapper';
import { CombustionEnthalpyService } from './combustion-enthalpy.service';
import { FlameSolverService } from './flame-solver.service';

/**
 * Mode 3 — liquid or gaseous fuel, one step. Same balance as the burnout step of two-step
 * solid combustion (FlameSolverService.burnGasStream):
 *   Σ n_i·h_i(T_flame) = H_fuel(T_fuel) + H_air(T_air) − Q_loss
 */
@Injectable()
export class FluidCombustionService {
  constructor(
    private readonly enthalpy: CombustionEnthalpyService,
    private readonly solver: FlameSolverService,
  ) {}

  calculate(dto: FluidFuelInputDto): FluidFuelResultDto {
    return dto.phase === FuelPhase.Gas ? this.gaseous(dto) : this.liquid(dto);
  }

  private gaseous(dto: FluidFuelInputDto): FluidFuelResultDto {
    const pO2   = dto.pO2   ?? COMBUSTION.DEFAULT_PO2;
    const wH2Om = dto.wH2Om ?? COMBUSTION.DEFAULT_W_H2OM;
    const { id, name, y } = resolveGaseousFuel(dto.fuelId, dto.fuelGas);
    const M_kgmol = gasMassFlow(y);
    const lhv = this.enthalpy.gasFuelLhv_Jkg(y);
    const mFuel_kgs = resolveFuelFlow(dto.mFuel_kgs, dto.fPower_W, lhv);

    const o2PerMol = stoichiometricO2(elementsOfGas(y).elements);
    if (!(o2PerMol > 0)) throw new BadRequestException('Fuel gas has no oxygen demand (not combustible)');

    const fuelFlows = scaleFlows(y, mFuel_kgs / M_kgmol);
    const air = airFlows(dto.kExcessAir * o2PerMol * mFuel_kgs / M_kgmol, pO2, wH2Om);
    const outcome = this.solver.burnGasStream(
      { flows: fuelFlows, T_K: dto.tFuel_K ?? COMBUSTION.T_REF_K },
      { flows: air, T_K: dto.tAir_K },
      dto.heatLoss_W ?? 0,
    );

    return {
      fuel:      summarizeGaseousFuel(id, name, y, pO2, this.enthalpy),
      mFuel_kgs,
      fPower_W:  mFuel_kgs * lhv,
      mAir_kgs:  gasMassFlow(air),
      tFlame_K:  outcome.T_K,
      combustion: toStepResult(outcome),
    };
  }

  private liquid(dto: FluidFuelInputDto): FluidFuelResultDto {
    if (!dto.fuel) throw new BadRequestException('`fuel` (elemental analysis) is required for liquid fuel');
    if (dto.fuelId !== undefined) throw new BadRequestException('No liquid fuel presets; use `fuel`');
    const fuel  = resolveCondensedFuel(undefined, dto.fuel, FuelPhase.Liquid);
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
}
