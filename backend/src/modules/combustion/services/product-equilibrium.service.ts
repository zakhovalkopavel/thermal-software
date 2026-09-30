import { Injectable } from '@nestjs/common';
import { GasPropertiesService } from '../../thermodynamics/services/gas-properties.service';
import { Species } from '../../thermodynamics/enums/species.enum';
import { Common } from '../../../common/thermal/utils/common';
import { brentq } from '../../../common/utils/root-finding.util';
import { COMBUSTION } from '../constants/combustion.constants';
import { ElementFlows, EquilibriumProducts, GasFlows } from '../interfaces/combustion-streams.interface';
import { sumFlows } from '../utils/element-balance.util';

/**
 * One-step product distribution from the element inventory.
 *
 *   N → N2, S → SO2 (sulfur takes its O first)
 *   O ≥ 2C + H/2          : complete combustion, surplus O as O2
 *   O ≤ C                 : all O as CO, remaining C as char, all H as H2
 *   C < O < 2C + H/2      : CO/CO2 and H2/H2O split by the water-gas shift
 *                           CO + H2O ⇌ CO2 + H2,  Kp(T) = exp(−ΔG°(T)/(R·T))
 *
 * WGS is equimolar, so Kp is pressure-independent. With x = n(CO2), E = O − C (O above CO),
 * h = H/2:  x·(h − E + x) = Kp·(C − x)·(E − x),  x ∈ [max(0, E − h), min(C, E)].
 */
@Injectable()
export class ProductEquilibriumService {
  constructor(private readonly gas: GasPropertiesService) {}

  /** Water-gas shift equilibrium constant Kp(T) [-] */
  wgsKp(T_K: number): number {
    const dG = this.gas.gibbsEnergy(Species.CO2, T_K) + this.gas.gibbsEnergy(Species.H2, T_K)
             - this.gas.gibbsEnergy(Species.CO, T_K)  - this.gas.gibbsEnergy(Species.H2O, T_K);
    return Math.exp(-dG / (Common.R * T_K));
  }

  solve(el: ElementFlows, T_K: number, inerts: GasFlows = {}): EquilibriumProducts {
    const { C, H, N, S } = el;
    const oFree = el.O - 2 * S;
    if (oFree < -1e-12 * Math.max(el.O, 1e-300)) {
      throw new Error('Product equilibrium: not enough oxygen to bind sulfur as SO2');
    }
    const O = Math.max(oFree, 0);
    const h = H / 2;

    const base: GasFlows = {};
    if (N > 0) base[Species.N2] = N / 2;
    if (S > 0) base[Species.SO2] = S;

    // Lean or stoichiometric: complete combustion
    if (O >= 2 * C + h) {
      const gas: GasFlows = { ...base, [Species.CO2]: C, [Species.H2O]: h };
      const o2 = (O - 2 * C - h) / 2;
      if (o2 > 0) gas[Species.O2] = o2;
      return { gas: sumFlows(gas, inerts), charC_mols: 0, wgsKp: null };
    }

    // Oxygen below C → CO: char remains
    if (O <= C) {
      const gas: GasFlows = { ...base, [Species.CO]: O, [Species.H2]: h };
      return { gas: sumFlows(gas, inerts), charC_mols: C - O, wgsKp: null };
    }

    const Kp = this.wgsKp(T_K);
    const E = O - C;
    const lo = Math.max(0, E - h);
    const hi = Math.min(C, E);
    let x = lo;
    if (hi > lo) {
      const f = (v: number): number => v * (h - E + v) - Kp * (C - v) * (E - v);
      const fLo = f(lo);
      const fHi = f(hi);
      if (fLo >= 0) x = lo;
      else if (fHi <= 0) x = hi;
      else x = brentq(f, lo, hi, (hi - lo) * COMBUSTION.WGS_ROOT_REL_TOL).root;
    }
    const gas: GasFlows = {
      ...base,
      [Species.CO2]: x,
      [Species.CO]:  C - x,
      [Species.H2O]: E - x,
      [Species.H2]:  h - (E - x),
    };
    return { gas: sumFlows(gas, inerts), charC_mols: 0, wgsKp: Kp };
  }
}
