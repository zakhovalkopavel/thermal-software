import { CompoundValue } from '../../types/compound-value.type';
import { CompoundValueBuilder } from '../../utils/compound-data/compound-value-builder';
import { GAS_COMPOUND_BINDING } from './gas-compound-binding';
import { Air } from './air';

/**
 * Pure-species key → thermophysical data from `shared/processed/compound-data`.
 * Keys match `Species` / combustion mechanism names.
 */
export const GAS_REGISTRY: Record<keyof typeof GAS_COMPOUND_BINDING, CompoundValue> = {
  Ar:     CompoundValueBuilder.forGas('Ar', GAS_COMPOUND_BINDING.Ar),
  N2:     CompoundValueBuilder.forGas('N2', GAS_COMPOUND_BINDING.N2),
  O2:     CompoundValueBuilder.forGas('O2', GAS_COMPOUND_BINDING.O2),
  CO2:    CompoundValueBuilder.forGas('CO2', GAS_COMPOUND_BINDING.CO2),
  CO:     CompoundValueBuilder.forGas('CO', GAS_COMPOUND_BINDING.CO),
  H2O:    CompoundValueBuilder.forGas('H2O', GAS_COMPOUND_BINDING.H2O),
  H2:     CompoundValueBuilder.forGas('H2', GAS_COMPOUND_BINDING.H2),
  CH4:    CompoundValueBuilder.forGas('CH4', GAS_COMPOUND_BINDING.CH4),
  C2H6:   CompoundValueBuilder.forGas('C2H6', GAS_COMPOUND_BINDING.C2H6),
  C3H8:   CompoundValueBuilder.forGas('C3H8', GAS_COMPOUND_BINDING.C3H8),
  C4H10:  CompoundValueBuilder.forGas('C4H10', GAS_COMPOUND_BINDING.C4H10),
  iC4H10: CompoundValueBuilder.forGas('iC4H10', GAS_COMPOUND_BINDING.iC4H10),
  C2H2:   CompoundValueBuilder.forGas('C2H2', GAS_COMPOUND_BINDING.C2H2),
  C3H4:   CompoundValueBuilder.forGas('C3H4', GAS_COMPOUND_BINDING.C3H4),
  aC3H4:  CompoundValueBuilder.forGas('aC3H4', GAS_COMPOUND_BINDING.aC3H4),
  C3H6:   CompoundValueBuilder.forGas('C3H6', GAS_COMPOUND_BINDING.C3H6),
  NH3:    CompoundValueBuilder.forGas('NH3', GAS_COMPOUND_BINDING.NH3),
  SO2:    CompoundValueBuilder.forGas('SO2', GAS_COMPOUND_BINDING.SO2),
  SO3:    CompoundValueBuilder.forGas('SO3', GAS_COMPOUND_BINDING.SO3),
  NO:     CompoundValueBuilder.forGas('NO', GAS_COMPOUND_BINDING.NO),
  NO2:    CompoundValueBuilder.forGas('NO2', GAS_COMPOUND_BINDING.NO2),
};

/**
 * All named fluids available to thermodynamics APIs: pure species + composition
 * compounds (air). Look up by key — no per-fluid branches.
 */
export const FLUID_REGISTRY: Readonly<Record<string, CompoundValue>> = {
  ...GAS_REGISTRY,
  air: Air,
};

export const {
  Ar, N2, O2, CO2, CO, H2O, H2, CH4,
  C2H6, C3H8, C4H10, iC4H10, C2H2, C3H4, aC3H4, C3H6,
  NH3, SO2, SO3, NO, NO2,
} = GAS_REGISTRY;
