import { Injectable } from '@nestjs/common';
import { PHYSICAL_CONSTANTS } from '../../../common/thermal/constants/physical.constants';
import { GAS_REGISTRY } from '../../../common/thermal/compound/gas/registry';
import { EvaluationResult } from '../../../common/thermal/interfaces/equation-validity.interface';
import { CompoundPropertyResolver } from '../../../common/thermal/utils/compound-properties/compound-property-resolver';
import {
  aggregateMixtureValidity,
  evaluateEquation,
} from '../../../common/thermal/utils/equation-validity.util';
import { EquationTypeDto } from '../../../common/thermal/dto/equation-type.dto';
import { EquationValue } from '../../../common/thermal/interfaces/equation-value.interface';
import { RefKey } from '../../../common/thermal/enum/ref-key.enum';
import { Species } from '../enums/species.enum';

@Injectable()
export class TransportService {

  /**
   * Dynamic viscosity of a pure species [Pa·s].
   * Uses the compound viscosity bucket (Sutherland when present as an equation row,
   * otherwise `def`), preserving stored min/max ranges.
   */
  viscosity(species: Species, T_K: number): number {
    return this.viscosityResult(species, T_K).value;
  }

  viscosityResult(species: Species, T_K: number): EvaluationResult {
    const compound = GAS_REGISTRY[species];
    if (!compound) throw new Error(`Unknown species: ${species}`);

    // Prefer the viscosity equation bucket so ranges are never dropped.
    // If a legacy sutherlandParams side-channel exists without a matching bucket row,
    // evaluate it with the stored min/max.
    const sutherlandRow = compound.viscosity.values.find(v => v.type === EquationTypeDto.sutherland);
    if (sutherlandRow) {
      return evaluateEquation(sutherlandRow, T_K);
    }

    const p = compound.sutherlandParams;
    if (p) {
      const entry: EquationValue = {
        type: EquationTypeDto.sutherland,
        ref: RefKey.White3,
        vars: { y0: p.mu0, T0: p.T0, S: p.S },
        min: p.min,
        max: p.max,
      };
      return evaluateEquation(entry, T_K);
    }

    return new CompoundPropertyResolver(compound).viscosityResult(T_K);
  }

  /**
   * Mixture dynamic viscosity via Wilke's mixing rule [Pa·s]
   * Source: [Leg] furnaceCombustion/classes/TransportProperties.js
   */
  viscosityMix(moleFractions: Partial<Record<Species, number>>, T_K: number): number {
    return this.viscosityMixResult(moleFractions, T_K).value;
  }

  viscosityMixResult(
    moleFractions: Partial<Record<Species, number>>,
    T_K: number,
  ): EvaluationResult & { mixtureValidity: ReturnType<typeof aggregateMixtureValidity> } {
    const species = (Object.keys(moleFractions) as Species[])
      .filter(sp => (moleFractions[sp] ?? 0) > 0 && GAS_REGISTRY[sp]);
    const mu_i: Record<string, number> = {};
    const components: Record<string, EvaluationResult['validity']> = {};
    for (const sp of species) {
      const r = this.viscosityResult(sp, T_K);
      mu_i[sp] = r.value;
      components[sp] = r.validity;
    }

    let mu_mix = 0;
    for (const i of species) {
      const yi = moleFractions[i] ?? 0;
      const Mi = GAS_REGISTRY[i].Mr;
      let denom = 0;
      for (const j of species) {
        const yj = moleFractions[j] ?? 0;
        const Mj = GAS_REGISTRY[j].Mr;
        const phi = Math.pow(1 + Math.sqrt(mu_i[i] / mu_i[j]) * Math.pow(Mj / Mi, 0.25), 2)
          / Math.sqrt(8 * (1 + Mi / Mj));
        denom += yj * phi;
      }
      mu_mix += yi * mu_i[i] / denom;
    }

    const mixtureValidity = aggregateMixtureValidity(components);
    const anyClamped = Object.values(components).some(v => v.action === 'clamped');
    const anyExtrapolated = Object.values(components).some(v => v.action === 'extrapolated');
    const anyUnknown = Object.values(components).some(v => v.rangeUnknown);
    return {
      value: mu_mix,
      validity: {
        requestedT: T_K,
        effectiveT: T_K,
        min: null,
        max: null,
        inRange: mixtureValidity.allInRange,
        rangeUnknown: anyUnknown,
        action: anyExtrapolated ? 'extrapolated' : anyClamped ? 'clamped' : 'none',
        message: mixtureValidity.allInRange
          ? undefined
          : 'One or more mixture components are outside their viscosity correlation range.',
      },
      mixtureValidity,
    };
  }

  /**
   * Thermal conductivity of a pure species [W/(m·K)].
   * Prefers the stored k(T) correlation (and its range) when present;
   * otherwise falls back to the Eucken-type relation λ = (Cp_mol + 1.25·R)·μ / M.
   */
  thermalConductivity(species: Species, T_K: number, Cp_J_molK: number): number {
    return this.thermalConductivityResult(species, T_K, Cp_J_molK).value;
  }

  thermalConductivityResult(
    species: Species,
    T_K: number,
    Cp_J_molK: number,
  ): EvaluationResult {
    const compound = GAS_REGISTRY[species];
    if (!compound) throw new Error(`Unknown species: ${species}`);

    if (compound.thermalConductivity.values.length > 0) {
      return new CompoundPropertyResolver(compound).thermalConductivityResult(T_K);
    }

    // Eucken fallback — inherits viscosity range status
    const muResult = this.viscosityResult(species, T_K);
    const M = compound.Mr;
    const value = (Cp_J_molK + 1.25 * PHYSICAL_CONSTANTS.GAS_CONSTANT_J_MOLK) * muResult.value / M;
    return {
      value,
      validity: {
        ...muResult.validity,
        message: muResult.validity.message
          ? `Eucken λ from μ: ${muResult.validity.message}`
          : 'Eucken λ from μ (no stored k(T) correlation).',
      },
    };
  }

  /**
   * Mixture thermal conductivity (simple mole-fraction-weighted) [W/(m·K)]
   * Source: [Leg] furnaceCombustion/classes/TransportProperties.js
   */
  thermalConductivityMix(
    moleFractions: Partial<Record<Species, number>>,
    T_K: number,
    cpBySpecies: Partial<Record<Species, number>>,
  ): number {
    return this.thermalConductivityMixResult(moleFractions, T_K, cpBySpecies).value;
  }

  thermalConductivityMixResult(
    moleFractions: Partial<Record<Species, number>>,
    T_K: number,
    cpBySpecies: Partial<Record<Species, number>>,
  ): EvaluationResult & { mixtureValidity: ReturnType<typeof aggregateMixtureValidity> } {
    const species = (Object.keys(moleFractions) as Species[])
      .filter(sp => (moleFractions[sp] ?? 0) > 0 && GAS_REGISTRY[sp]);
    let num = 0; let den = 0;
    const components: Record<string, EvaluationResult['validity']> = {};
    for (const sp of species) {
      const y  = moleFractions[sp] ?? 0;
      const Cp = cpBySpecies[sp] ?? 30.0;
      const r = this.thermalConductivityResult(sp, T_K, Cp);
      components[sp] = r.validity;
      num += y * r.value;
      den += y;
    }
    const mixtureValidity = aggregateMixtureValidity(components);
    const anyClamped = Object.values(components).some(v => v.action === 'clamped');
    const anyExtrapolated = Object.values(components).some(v => v.action === 'extrapolated');
    const anyUnknown = Object.values(components).some(v => v.rangeUnknown);
    return {
      value: den > 0 ? num / den : 0,
      validity: {
        requestedT: T_K,
        effectiveT: T_K,
        min: null,
        max: null,
        inRange: mixtureValidity.allInRange,
        rangeUnknown: anyUnknown,
        action: anyExtrapolated ? 'extrapolated' : anyClamped ? 'clamped' : 'none',
        message: mixtureValidity.allInRange
          ? undefined
          : 'One or more mixture components are outside their conductivity correlation range.',
      },
      mixtureValidity,
    };
  }
}
