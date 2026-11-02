import { CompoundValue } from '../../interfaces/compound-value.interface';
import { compoundValueForGas } from '../../utils/compound-data/compound-value-for-gas.util';
import { GAS_COMPOUND_BINDING } from './gas-compound-binding';

/**
 * Species key → thermophysical data loaded from `shared/processed/compound-data`.
 * Air is a mixture and is not in this registry (`Air` in `air.ts`).
 */
export const GAS_REGISTRY: Record<keyof typeof GAS_COMPOUND_BINDING, CompoundValue> = {
  Ar:     compoundValueForGas('Ar', GAS_COMPOUND_BINDING.Ar),
  N2:     compoundValueForGas('N2', GAS_COMPOUND_BINDING.N2),
  O2:     compoundValueForGas('O2', GAS_COMPOUND_BINDING.O2),
  CO2:    compoundValueForGas('CO2', GAS_COMPOUND_BINDING.CO2),
  CO:     compoundValueForGas('CO', GAS_COMPOUND_BINDING.CO),
  H2O:    compoundValueForGas('H2O', GAS_COMPOUND_BINDING.H2O),
  H2:     compoundValueForGas('H2', GAS_COMPOUND_BINDING.H2),
  CH4:    compoundValueForGas('CH4', GAS_COMPOUND_BINDING.CH4),
  C2H6:   compoundValueForGas('C2H6', GAS_COMPOUND_BINDING.C2H6),
  C3H8:   compoundValueForGas('C3H8', GAS_COMPOUND_BINDING.C3H8),
  C4H10:  compoundValueForGas('C4H10', GAS_COMPOUND_BINDING.C4H10),
  iC4H10: compoundValueForGas('iC4H10', GAS_COMPOUND_BINDING.iC4H10),
  C2H2:   compoundValueForGas('C2H2', GAS_COMPOUND_BINDING.C2H2),
  C3H4:   compoundValueForGas('C3H4', GAS_COMPOUND_BINDING.C3H4),
  aC3H4:  compoundValueForGas('aC3H4', GAS_COMPOUND_BINDING.aC3H4),
  C3H6:   compoundValueForGas('C3H6', GAS_COMPOUND_BINDING.C3H6),
  NH3:    compoundValueForGas('NH3', GAS_COMPOUND_BINDING.NH3),
  SO2:    compoundValueForGas('SO2', GAS_COMPOUND_BINDING.SO2),
  SO3:    compoundValueForGas('SO3', GAS_COMPOUND_BINDING.SO3),
  NO:     compoundValueForGas('NO', GAS_COMPOUND_BINDING.NO),
  NO2:    compoundValueForGas('NO2', GAS_COMPOUND_BINDING.NO2),
};

export const {
  Ar, N2, O2, CO2, CO, H2O, H2, CH4,
  C2H6, C3H8, C4H10, iC4H10, C2H2, C3H4, aC3H4, C3H6,
  NH3, SO2, SO3, NO, NO2,
} = GAS_REGISTRY;
