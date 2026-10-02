import { CondensedFuel } from '../../interfaces';
import { FuelSummaryDto } from '../../dto/common';
import { CombustionEnthalpyService } from '../../services/combustion-enthalpy.service';
import { elementsOfCondensed, stoichiometricO2 } from '../element-balance';
import { dryAirMass } from './dry-air-mass.util';

export function summarizeCondensedFuel(
  fuel: CondensedFuel, pO2: number, enthalpy: CombustionEnthalpyService,
): FuelSummaryDto {
  return {
    id:    fuel.id,
    name:  fuel.name,
    phase: fuel.phase,
    lhv_Jkg:             enthalpy.fuelLhv_Jkg(fuel),
    heatOfFormation_Jkg: enthalpy.fuelFormationEnthalpy_Jkg(fuel),
    stoichAir_kgkg:      dryAirMass(stoichiometricO2(elementsOfCondensed(fuel.elementalComp, 1)), pO2),
  };
}
