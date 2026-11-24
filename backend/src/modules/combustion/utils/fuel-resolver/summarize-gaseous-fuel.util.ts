import { COMBUSTION } from '../../constants';
import { FuelPhase } from '../../enums/fuel-phase.enum';
import { FuelSummaryDto } from '../../dto/common';
import { GasFlows } from '../../types';
import { CombustionEnthalpyService } from '../../services/combustion-enthalpy.service';
import { elementsOfGas, stoichiometricO2 } from '../element-balance';
import { gasMassFlow } from '../gas-flows';
import { dryAirMass } from './dry-air-mass.util';

/** Summary of a gaseous fuel given by normalised mole fractions */
export function summarizeGaseousFuel(
  id: string, name: string, y: GasFlows, pO2: number, enthalpy: CombustionEnthalpyService,
): FuelSummaryDto {
  const M_kgmol = gasMassFlow(y);
  return {
    id, name,
    phase: FuelPhase.Gas,
    lhv_Jkg:             enthalpy.gasFuelLhv_Jkg(y),
    heatOfFormation_Jkg: enthalpy.gasEnthalpy_W(y, COMBUSTION.T_REF_K) / M_kgmol,
    stoichAir_kgkg:      dryAirMass(stoichiometricO2(elementsOfGas(y).elements) / M_kgmol, pO2),
    moleFractions:       { ...y },
  };
}
