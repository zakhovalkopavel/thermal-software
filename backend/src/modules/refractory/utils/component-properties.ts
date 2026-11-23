import { CALCULATION_CONSTANTS } from '../constants/calculation.constants';
import { COMPONENT_PROPERTIES } from '../data/component-properties.data';
import type { ComponentProperty } from '../types/component-property.type';
import type { ComponentsByCategory } from '../types/components-by-category.type';

/**
 * Lookups and weighted aggregates over {@link COMPONENT_PROPERTIES}.
 * Stateless — no DI.
 */
export class ComponentProperties {
  /** Resolve one component by chemical formula (`SiO2`, …). */
  static get(formula: string): ComponentProperty | undefined {
    return COMPONENT_PROPERTIES[formula];
  }

  /** All registered formulas. */
  static formulas(): string[] {
    return Object.keys(COMPONENT_PROPERTIES);
  }

  static byCategory(category: ComponentProperty['category']): ComponentProperty[] {
    return Object.values(COMPONENT_PROPERTIES).filter((comp) => comp.category === category);
  }

  static byClassification(
    classification: ComponentProperty['classification'],
  ): ComponentProperty[] {
    return Object.values(COMPONENT_PROPERTIES).filter(
      (comp) => comp.classification === classification,
    );
  }

  /** Weighted refractoriness effect [K] from composition wt%. */
  static refractorinessEffect(composition: Record<string, number>): number {
    return ComponentProperties.sumEffect(composition, (c) => c.refractorinessEffect);
  }

  /** Weighted liquidus effect [K] from composition wt%. */
  static liquidusEffect(composition: Record<string, number>): number {
    return ComponentProperties.sumEffect(composition, (c) => c.liquidusEffect);
  }

  /** Weighted viscosity effect [K] from composition wt% (skips missing viscosityEffect). */
  static viscosityEffect(composition: Record<string, number>): number {
    return ComponentProperties.sumEffect(composition, (c) => c.viscosityEffect ?? 0, true);
  }

  /** Mass-weighted thermal conductivity [W/(m·K)]; falls back to 1 when empty. */
  static weightedThermalConductivity(composition: Record<string, number>): number {
    let k = 0;
    for (const [formula, percentage] of Object.entries(composition)) {
      const component = ComponentProperties.get(formula);
      if (component && percentage > 0) {
        k += (percentage / 100) * component.conductivity_WmK;
      }
    }
    return k > 0 ? k : 1.0;
  }

  /** Mass-weighted specific heat [J/(kg·K)]; falls back to {@link CALCULATION_CONSTANTS.BASE_SPECIFIC_HEAT_JKGK}. */
  static weightedSpecificHeat(composition: Record<string, number>): number {
    let cp = 0;
    let totalWeight = 0;
    for (const [formula, percentage] of Object.entries(composition)) {
      const component = ComponentProperties.get(formula);
      if (component && percentage > 0) {
        cp += (percentage / 100) * component.specificHeat_JkgK;
        totalWeight += percentage;
      }
    }
    return totalWeight > 0 ? cp : CALCULATION_CONSTANTS.BASE_SPECIFIC_HEAT_JKGK;
  }

  /** Apply liquidEnrichmentFactor to each positive component. */
  static liquidCompositionWithEnrichment(
    composition: Record<string, number>,
  ): Record<string, number> {
    return ComponentProperties.enrich(composition, 'liquidEnrichmentFactor');
  }

  /** Apply solidEnrichmentFactor to each positive component. */
  static solidCompositionWithEnrichment(
    composition: Record<string, number>,
  ): Record<string, number> {
    return ComponentProperties.enrich(composition, 'solidEnrichmentFactor');
  }

  /** Bucket composition wt% by component category. */
  static extractByCategory(composition: Record<string, number>): ComponentsByCategory {
    const result: ComponentsByCategory = {
      oxideFormers: {},
      oxideModifiers: {},
      fluorides: {},
      chlorides: {},
    };

    for (const [formula, percentage] of Object.entries(composition)) {
      if (percentage <= 0) continue;
      const component = ComponentProperties.get(formula);
      if (!component) continue;

      switch (component.category) {
        case 'oxide-former':
          result.oxideFormers[formula] = percentage;
          break;
        case 'oxide-modifier':
          result.oxideModifiers[formula] = percentage;
          break;
        case 'fluoride':
          result.fluorides[formula] = percentage;
          break;
        case 'chloride':
          result.chlorides[formula] = percentage;
          break;
      }
    }

    return result;
  }

  private static sumEffect(
    composition: Record<string, number>,
    pick: (c: ComponentProperty) => number,
    skipZeroPick = false,
  ): number {
    let total = 0;
    for (const [formula, percentage] of Object.entries(composition)) {
      const component = ComponentProperties.get(formula);
      if (!component || percentage <= 0) continue;
      const value = pick(component);
      if (skipZeroPick && value === 0) continue;
      total += (percentage / 100) * value;
    }
    return total;
  }

  private static enrich(
    composition: Record<string, number>,
    factorKey: 'liquidEnrichmentFactor' | 'solidEnrichmentFactor',
  ): Record<string, number> {
    const out: Record<string, number> = {};
    for (const [formula, percentage] of Object.entries(composition)) {
      const component = ComponentProperties.get(formula);
      const factor = component?.[factorKey];
      if (component && factor !== undefined && percentage > 0) {
        out[formula] = percentage * factor;
      }
    }
    return out;
  }
}
