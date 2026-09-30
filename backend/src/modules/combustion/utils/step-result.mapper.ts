import { Species } from '../../thermodynamics/enums/species.enum';
import { ATOMIC_MASS } from '../constants/combustion.constants';
import { CombustionStepResultDto, SpeciesValues } from '../dto/combustion-step-result.dto';
import { GasFlows, ReactionStepOutcome } from '../interfaces/combustion-streams.interface';
import { gasMassFlow, massFractions, moleFractions, speciesMolarMass } from './element-balance.util';

export const PRODUCT_SPECIES: readonly Species[] = [
  Species.N2, Species.O2, Species.CO2, Species.CO, Species.H2O, Species.H2, Species.SO2,
];

/** Fixed-key species map: product species always present, extra species appended */
export function toSpeciesValues(flows: GasFlows): SpeciesValues {
  const out: SpeciesValues = {};
  for (const sp of PRODUCT_SPECIES) out[sp] = flows[sp] ?? 0;
  for (const [sp, v] of Object.entries(flows)) if (!(sp in out)) out[sp] = v ?? 0;
  return out;
}

export function massFlows(flows: GasFlows): GasFlows {
  const out: GasFlows = {};
  for (const [sp, n] of Object.entries(flows) as [Species, number][]) out[sp] = n * speciesMolarMass(sp);
  return out;
}

export function toStepResult(o: ReactionStepOutcome): CombustionStepResultDto {
  const gas = o.products.gas;
  return {
    tOut_K:    o.T_K,
    excessAir: o.o2Stoich_mols > 0 ? o.o2Supplied_mols / o.o2Stoich_mols : Infinity,
    products: {
      moleFlows_mols: toSpeciesValues(gas),
      massFlows_kgs:  toSpeciesValues(massFlows(gas)),
      moleFractions:  toSpeciesValues(moleFractions(gas)),
      massFractions:  toSpeciesValues(massFractions(gas)),
    },
    mGas_kgs:           gasMassFlow(gas),
    charCarbon_kgs:     o.products.charC_mols * ATOMIC_MASS.C,
    ash_kgs:            o.ash_kgs,
    reactantEnthalpy_W: o.reactantEnthalpy_W,
    productEnthalpy_W:  o.productEnthalpy_W,
    heatLoss_W:         o.heatLoss_W,
    wgsKp:              o.products.wgsKp,
    elementBalanceResidual: o.elementBalanceResidual,
  };
}
