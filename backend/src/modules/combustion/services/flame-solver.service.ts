import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { Species } from '../../thermodynamics/enums/species.enum';
import { brentq } from '../../../common/utils/root-finding.util';
import { COMBUSTION } from '../constants/combustion.constants';
import { CondensedFuel } from '../data/fuels/fuel.interface';
import {
  ElementFlows, EquilibriumProducts, GasFlows, GasStream, ReactionStepInput, ReactionStepOutcome,
} from '../interfaces/combustion-streams.interface';
import {
  addElements, airFlows, elementResidual, elementsOfCondensed, elementsOfGas, emptyElements,
  stoichiometricO2, sumFlows,
} from '../utils/element-balance.util';
import { CombustionEnthalpyService } from './combustion-enthalpy.service';
import { ProductEquilibriumService } from './product-equilibrium.service';

/**
 * Energy balance of one reacting step, solved for the outlet temperature with brentq:
 *
 *   g(T) = H_products(T, x(T)) + Q_loss − H_reactants = 0
 *   H_reactants = Σ_streams Σ_i n_i·h_i(T_stream) + m_fuel·h_fuel(T_fuel)
 *   H_products  = Σ_j n_j(T)·h_j(T) + m_ash·h_ash(T) + n_char·h_C(T)
 *
 * x(T) is the equilibrium product distribution (ProductEquilibriumService), re-evaluated at
 * every trial temperature. H_products is increasing in T, so the root is unique.
 */
@Injectable()
export class FlameSolverService {
  constructor(
    private readonly enthalpy: CombustionEnthalpyService,
    private readonly equilibrium: ProductEquilibriumService,
  ) {}

  /**
   * Solid/liquid fuel burned with air at excess-air ratio λ.
   * λ = O2 in air / stoichiometric O2 of the fuel (humidity is O2-neutral).
   */
  burnCondensed(p: {
    fuel: CondensedFuel; mFuel_kgs: number; tFuel_K: number;
    kExcessAir: number; tAir_K: number; pO2: number; wH2Om: number; heatLoss_W?: number;
  }): { outcome: ReactionStepOutcome; air: GasFlows } {
    const o2Stoich = stoichiometricO2(elementsOfCondensed(p.fuel.elementalComp, p.mFuel_kgs));
    const air = airFlows(p.kExcessAir * Math.max(o2Stoich, 0), p.pO2, p.wH2Om);
    const outcome = this.solveStep({
      condensed:  { fuel: p.fuel, m_kgs: p.mFuel_kgs, T_K: p.tFuel_K },
      gasStreams: [{ flows: air, T_K: p.tAir_K }],
      heatLoss_W: p.heatLoss_W,
    });
    return { outcome, air };
  }

  /** Gas stream (fuel gas, generator gas, bed outlet gas) burned with a given air stream */
  burnGasStream(fuelGas: GasStream, air: GasStream, heatLoss_W = 0): ReactionStepOutcome {
    return this.solveStep({ gasStreams: [fuelGas, air], heatLoss_W });
  }

  solveStep(input: ReactionStepInput): ReactionStepOutcome {
    const heatLoss_W = input.heatLoss_W ?? 0;

    let elements: ElementFlows = emptyElements();
    let inerts: GasFlows = {};
    let o2Supplied_mols = 0;
    let reactantEnthalpy_W = 0;
    for (const stream of input.gasStreams) {
      const parts = elementsOfGas(stream.flows);
      elements = addElements(elements, parts.elements);
      inerts = sumFlows(inerts, parts.inerts);
      o2Supplied_mols += stream.flows[Species.O2] ?? 0;
      reactantEnthalpy_W += this.enthalpy.gasEnthalpy_W(stream.flows, stream.T_K);
    }

    let ash_kgs = 0;
    if (input.condensed) {
      const { fuel, m_kgs, T_K } = input.condensed;
      elements = addElements(elements, elementsOfCondensed(fuel.elementalComp, m_kgs));
      ash_kgs = m_kgs * fuel.elementalComp.ash;
      reactantEnthalpy_W += this.enthalpy.condensedEnthalpy_W(fuel, m_kgs, T_K);
    }

    const productEnthalpy = (p: EquilibriumProducts, T: number): number =>
      this.enthalpy.gasEnthalpy_W(p.gas, T)
      + this.enthalpy.charEnthalpy_W(p.charC_mols, T)
      + this.enthalpy.ashEnthalpy_W(ash_kgs, T);

    const g = (T: number): number =>
      productEnthalpy(this.equilibrium.solve(elements, T, inerts), T) + heatLoss_W - reactantEnthalpy_W;

    const lo = COMBUSTION.FLAME_T_MIN_K;
    const hi = COMBUSTION.FLAME_T_MAX_K;
    if (g(lo) > 0) {
      throw new UnprocessableEntityException(
        `Energy balance has no root: heat release minus losses is too low, outlet temperature would be below ${lo} K`,
      );
    }
    if (g(hi) < 0) {
      throw new UnprocessableEntityException(`Energy balance has no root: outlet temperature would exceed ${hi} K`);
    }
    const T_K = brentq(g, lo, hi, COMBUSTION.FLAME_ROOT_TOL).root;
    const products = this.equilibrium.solve(elements, T_K, inerts);

    const out = elementsOfGas(products.gas).elements;
    out.C += products.charC_mols;

    return {
      T_K,
      products,
      ash_kgs,
      elements,
      o2Stoich_mols: stoichiometricO2(elements) + o2Supplied_mols,
      o2Supplied_mols,
      reactantEnthalpy_W,
      productEnthalpy_W: productEnthalpy(products, T_K),
      heatLoss_W,
      elementBalanceResidual: elementResidual(elements, out),
    };
  }
}
