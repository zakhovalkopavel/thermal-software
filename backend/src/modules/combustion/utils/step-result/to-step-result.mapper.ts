import { Species } from '../../../thermodynamics/enums';
import { ATOMIC_MASS } from '../../constants';
import { CombustionStepResultDto } from '../../dto/common';
import { GasFlows } from '../../types';
import { ReactionStepOutcome } from '../../interfaces';
import { gasMassFlow, massFractions, moleFractions, speciesMolarMass } from '../gas-flows';
import { toSpeciesValues } from './to-species-values.mapper';

function massFlows(flows: GasFlows): GasFlows {
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
