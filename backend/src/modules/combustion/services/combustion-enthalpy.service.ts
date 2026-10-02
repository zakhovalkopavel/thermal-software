import { Injectable } from '@nestjs/common';
import { GasPropertiesService } from '../../thermodynamics/services/gas-properties.service';
import { Species } from '../../thermodynamics/enums';
import { ATOMIC_MASS, COMBUSTION } from '../constants';
import { CondensedFuel, ElementalComposition } from '../interfaces';
import { ElementFlows, GasFlows } from '../types';
import { elementsOfCondensed, elementsOfGas } from '../utils/element-balance';
import { gasMassFlow } from '../utils/gas-flows';

/**
 * Absolute (formation-referenced) enthalpies of combustion streams.
 *
 *   gas species:  h_i(T)    = ΔHf_i(298) + cp̄_i[298..T]·(T − 298)     [J/mol]  (NASA-7)
 *   fuel:         h_fuel(T) = ΔHf_fuel + c_fuel·(T − 298)                [J/kg]
 *   ash:          h_ash(T)  = c_ash·(T − 298)                            [J/kg]
 *   char (C):     h_C(T)    = c_fuel·(T − 298)                           [J/kg]  (graphite ΔHf = 0)
 */
@Injectable()
export class CombustionEnthalpyService {
  constructor(private readonly gas: GasPropertiesService) {}

  /** Enthalpy flow of a gas stream [W] */
  gasEnthalpy_W(flows: GasFlows, T_K: number): number {
    return this.gas.absoluteEnthalpyMixture(flows, T_K);
  }

  /** ΔHf of the complete-combustion products (CO2, H2O vapour, SO2, N2) of an element inventory [W or J] */
  completeProductsFormation(el: ElementFlows): number {
    const T = COMBUSTION.T_REF_K;
    return el.C * this.gas.absoluteEnthalpy(Species.CO2, T)
         + (el.H / 2) * this.gas.absoluteEnthalpy(Species.H2O, T)
         + el.S * this.gas.absoluteEnthalpy(Species.SO2, T)
         + (el.N / 2) * this.gas.absoluteEnthalpy(Species.N2, T);
  }

  /** ΔHf of the complete-combustion products per kg of fuel [J/kg] */
  completeProductsFormation_Jkg(comp: ElementalComposition): number {
    return this.completeProductsFormation(elementsOfCondensed(comp, 1));
  }

  /**
   * Fuel formation enthalpy [J/kg]: record value if present, otherwise from the LHV:
   * ΔHf_fuel = Σ ΔHf(complete products) + LHV
   */
  fuelFormationEnthalpy_Jkg(fuel: CondensedFuel): number {
    if (fuel.heatOfFormation_J_kg !== undefined) return fuel.heatOfFormation_J_kg;
    if (fuel.lhv_J_kg === undefined) {
      throw new Error(`Fuel ${fuel.id}: either heatOfFormation_J_kg or lhv_J_kg is required`);
    }
    return this.completeProductsFormation_Jkg(fuel.elementalComp) + fuel.lhv_J_kg;
  }

  /** Lower heating value [J/kg]: record value if present, otherwise ΔHf_fuel − Σ ΔHf(products) */
  fuelLhv_Jkg(fuel: CondensedFuel): number {
    if (fuel.lhv_J_kg !== undefined) return fuel.lhv_J_kg;
    return this.fuelFormationEnthalpy_Jkg(fuel) - this.completeProductsFormation_Jkg(fuel.elementalComp);
  }

  /** Enthalpy flow of a condensed fuel stream (incl. ash and moisture) [W] */
  condensedEnthalpy_W(fuel: CondensedFuel, m_kgs: number, T_K: number): number {
    return m_kgs * (this.fuelFormationEnthalpy_Jkg(fuel) + fuel.specificHeat_J_kgK * (T_K - COMBUSTION.T_REF_K));
  }

  ashEnthalpy_W(m_kgs: number, T_K: number): number {
    return m_kgs * COMBUSTION.ASH_CAPACITY_J_KGK * (T_K - COMBUSTION.T_REF_K);
  }

  charEnthalpy_W(charC_mols: number, T_K: number): number {
    return charC_mols * ATOMIC_MASS.C * COMBUSTION.FUEL_CAPACITY_J_KGK * (T_K - COMBUSTION.T_REF_K);
  }

  /** LHV of a gaseous fuel [J/kg of fuel gas] */
  gasFuelLhv_Jkg(moleFlows: GasFlows): number {
    const { elements } = elementsOfGas(moleFlows);
    const hFuel = this.gasEnthalpy_W(moleFlows, COMBUSTION.T_REF_K);
    return (hFuel - this.completeProductsFormation(elements)) / gasMassFlow(moleFlows);
  }
}
