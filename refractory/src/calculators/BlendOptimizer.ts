/**
 * Blend Optimizer
 *
 * Optimizes particle size distribution blends using multiple methods and scenarios.
 * Integrates PSD calculation, packing models, and shrinkage prediction.
 *
 * TODO v1.1.0: Fixed fractions support
 * - BlendOptimizer will pass fractions (including isFixed flags) to PSDCalculator
 * - PSDCalculator handles fixed vs variable separation
 * - Results will include tracking of which fractions were fixed
 * - No major changes needed in BlendOptimizer.optimize() method
 * - May need to update documentation/comments to explain fixed fractions
 *
 * References:
 * - de Larrard, F. (1999) "Concrete Mixture Proportioning"
 * - Funk & Dinger (1994) "Predictive Process Control"
 * - Banerjee, S. (2004) "Monolithic Refractories"
 *
 * @module BlendOptimizer
 */

import { FractionInput, MaterialEntry, OptimizationOptions, FinalProperties, BaseComposition, PSDResult } from '../types/blend-types';
import { PSDCalculator } from './PSDCalculator';
import { PackingCalculator } from './PackingCalculator';
import { ShrinkageCalculator } from './ShrinkageCalculator';
import { MaterialLibrary } from '../data/MaterialLibrary';

export class BlendOptimizer {
  private materialLibrary: MaterialLibrary;

  constructor() {
    this.materialLibrary = MaterialLibrary.getInstance();
  }

  /**
   * Optimize blend using specified options
   *
   * @param fractions Input fractions with size ranges and materials
   * @param options Optimization parameters
   * @returns Array of optimized blend results for each method/scenario combination
   */
  public optimize(
    fractions: FractionInput[],
    options: OptimizationOptions = {}
  ): FinalProperties[] {
    // Set defaults
    const {
      qValues = [0.25, 0.27, 0.30, 0.33],
      methods = ['Andreasen', 'FunkDinger'],
      packingModels = ['CPM', 'Furnas'],
      scenarios = ['Self-compacting', 'Flowable', 'Vibratable', 'Hand-pressable'],
      temperatureProfile_C = [600, 800, 1000, 1200],
      waterCementRatio = 0.35,
      baseComposition
    } = options;

    const results: FinalProperties[] = [];

    // Get materials for each fraction
    const materials: MaterialEntry[] = fractions.map(f => {
      const mat = this.materialLibrary.getMaterial(f.materialId);
      if (!mat) {
        throw new Error(`Material not found: ${f.materialId}`);
      }
      return mat;
    });

    // Iterate through all combinations
    for (const method of methods) {
      for (const q of qValues) {
        for (const scenario of scenarios) {
          // Calculate PSD
          let psdResult;
          if (method === 'Andreasen') {
            psdResult = PSDCalculator.andreasenDiscrete(fractions, q);
          } else {
            psdResult = PSDCalculator.funkDingerDiscrete(fractions, q);
          }

          // For each packing model
          for (const packingModel of packingModels) {
            const properties = this.calculateProperties(
              fractions,
              materials,
              psdResult,
              scenario,
              packingModel as 'CPM' | 'Furnas',
              temperatureProfile_C,
              waterCementRatio,
              baseComposition
            );

            results.push(properties);
          }
        }
      }
    }

    return results;
  }

  /**
   * Calculate complete blend properties
   */
  private calculateProperties(
    fractions: FractionInput[],
    materials: MaterialEntry[],
    psdResult: PSDResult,
    scenario: string,
    packingModel: 'CPM' | 'Furnas',
    temperatureProfile_C: number[],
    waterCementRatio: number,
    baseComposition?: BaseComposition[]
  ): FinalProperties {
    // Extract values from psdResult
    const { massFractions, massFractionsRoundedPercent, method, q } = psdResult;

    // 1. Prepare packing inputs
    const densities_kgm3 = materials.map(m => m.rho_true_after_firing_kgm3);
    const diameters_mm = fractions.map(f => (f.dMin_mm + f.dMax_mm) / 2);  // Use geometric mean

    const packingInputs = {
      massFractions,
      densities_kgm3,
      diameters_mm,
      compactionPressure_MPa: this.getCompactionPressure(scenario)
    };

    // Calculate packing
    const packingResult = packingModel === 'CPM'
      ? PackingCalculator.calculateCPM(packingInputs, { K: this.getCompactionIndex(scenario) })
      : PackingCalculator.calculateFurnas(packingInputs);

    // 2. Calculate skeletal density
    const rhoSkeletal = this.calculateSkeletalDensity(materials, massFractions);

    // 3. Calculate bulk density (green state)
    const rhoBulk_green = rhoSkeletal * packingResult.packingFraction_phi;

    // 4. Estimate cement content (simplified - look for CAC/cement materials)
    const cementContent = this.estimateCementContent(materials, massFractions);

    // 5. Calculate shrinkage
    const shrinkageResult = ShrinkageCalculator.calculateCompleteShrinkage({
      materials,
      massFractions,
      temperatureProfile_C,
      waterCementRatio,
      cementContent
    });

    // 6. Calculate densities and porosities after drying and firing
    const rhoBulk_dried = rhoBulk_green * (1 - shrinkageResult.chemicalShrinkage_volFrac);
    const porosity_green = (1 - packingResult.packingFraction_phi) * 100;
    const porosity_dried = porosity_green * (1 - shrinkageResult.chemicalShrinkage_volFrac);

    const rhoBulk_byTemp: { [key: string]: number } = {};
    const porosity_byTemp: { [key: string]: number } = {};
    const waterAbsorption_byTemp: { [key: string]: number } = {};

    for (const temp of temperatureProfile_C) {
      const tempKey = temp.toString();
      const totalShrinkage = shrinkageResult.totalVolumetricShrinkageByTemp[tempKey] || 0;

      // Density increases as material shrinks
      rhoBulk_byTemp[tempKey] = this.round(rhoBulk_dried * (1 + totalShrinkage), 2);

      // Porosity changes with sintering
      const currentPorosity = porosity_dried * (1 - totalShrinkage);
      porosity_byTemp[tempKey] = this.round(Math.max(0, currentPorosity), 1);

      // Water absorption (mass %) = porosity (vol %) / density
      waterAbsorption_byTemp[tempKey] = this.round(
        (currentPorosity / 100) * (rhoSkeletal / rhoBulk_byTemp[tempKey]),
        1
      );
    }

    // 7. Calculate flowability
    const flowabilityCategory = this.determineFlowability(q, scenario);

    // 8. Calculate parts to add per 100 base (if base composition provided)
    let partsToAddPer100Base: { fractionId: string; parts: number }[] | undefined;
    if (baseComposition) {
      partsToAddPer100Base = this.calculatePartsToAdd(
        fractions,
        massFractionsRoundedPercent,
        baseComposition
      );
    }

    return {
      method,
      q,
      scenario,
      fractions,
      massFractions,
      massFractionsRoundedPercent,
      rhoSkeletal_gml: this.round(rhoSkeletal / 1000, 2),  // Convert kg/m³ to g/ml
      rhoBulk_gml_green: this.round(rhoBulk_green / 1000, 2),
      rhoBulk_gml_dried: this.round(rhoBulk_dried / 1000, 2),
      rhoBulk_gml_byTemp: this.convertToGml(rhoBulk_byTemp),
      porosity_percent_green: this.round(porosity_green, 1),
      porosity_percent_dried: this.round(porosity_dried, 1),
      porosity_percent_byTemp: porosity_byTemp,
      waterAbsorption_percent_dried: this.round(porosity_dried / 10, 1),  // Approximate
      waterAbsorption_percent_byTemp: waterAbsorption_byTemp,
      flowabilityCategory,
      packingEfficiency: packingResult.packingFraction_phi,
      shrinkage: shrinkageResult,
      partsToAddPer100Base,
      intermediate: {
        packing: packingResult,
        psd: psdResult  // Use the complete PSDResult object
      }
    };
  }

  /**
   * Calculate skeletal (true) density from materials and mass fractions
   */
  private calculateSkeletalDensity(materials: MaterialEntry[], massFractions: number[]): number {
    let weightedDensity = 0;
    for (let i = 0; i < materials.length; i++) {
      weightedDensity += materials[i].rho_true_after_firing_kgm3 * massFractions[i];
    }
    return weightedDensity;
  }

  /**
   * Estimate cement content from materials
   */
  private estimateCementContent(materials: MaterialEntry[], massFractions: number[]): number {
    let cementContent = 0;
    for (let i = 0; i < materials.length; i++) {
      const matName = materials[i].name.toLowerCase();
      if (matName.includes('cement') || matName.includes('cac') || matName.includes('ciment')) {
        cementContent += massFractions[i];
      }
    }
    return cementContent;
  }

  /**
   * Get compaction index for CPM based on scenario
   */
  private getCompactionIndex(scenario: string): number {
    const indices: { [key: string]: number } = {
      'Self-compacting': 4.1,  // Minimal compaction
      'Flowable': 4.5,
      'Vibratable': 5.0,
      'Hand-pressable': 6.0  // High compaction
    };
    return indices[scenario] || 5.0;
  }

  /**
   * Get compaction pressure for scenario
   */
  private getCompactionPressure(scenario: string): number {
    const pressures: { [key: string]: number } = {
      'Self-compacting': 0.01,  // Minimal pressure
      'Flowable': 0.05,
      'Vibratable': 0.2,
      'Hand-pressable': 1.0  // High pressure
    };
    return pressures[scenario] || 0.2;
  }

  /**
   * Determine flowability category based on q and scenario
   */
  private determineFlowability(
    q: number,
    scenario: string
  ): 'Self-compacting' | 'Flowable' | 'Vibratable' | 'Hand-pressable' {
    // Scenario takes precedence, but validate with q value
    if (scenario === 'Self-compacting' || q <= 0.26) {
      return 'Self-compacting';
    } else if (scenario === 'Flowable' || q <= 0.29) {
      return 'Flowable';
    } else if (scenario === 'Vibratable' || q <= 0.32) {
      return 'Vibratable';
    } else {
      return 'Hand-pressable';
    }
  }

  /**
   * Calculate parts to add per 100 parts of base composition
   */
  private calculatePartsToAdd(
    fractions: FractionInput[],
    massFractionsRounded: number[],
    baseComposition: BaseComposition[]
  ): { fractionId: string; parts: number }[] {
    const result: { fractionId: string; parts: number }[] = [];

    // Create map of base composition
    const baseMap = new Map<string, number>();
    for (const base of baseComposition) {
      baseMap.set(base.fractionId, base.massPercent);
    }

    // Calculate total base mass
    const totalBase = baseComposition.reduce((sum, b) => sum + b.massPercent, 0);

    // For each fraction in optimized blend
    for (let i = 0; i < fractions.length; i++) {
      const fractionId = fractions[i].id;
      const targetPercent = massFractionsRounded[i];
      const basePercent = baseMap.get(fractionId) || 0;

      // Calculate difference scaled to 100 parts base
      const partsToAdd = (targetPercent - basePercent) * (100 / totalBase);

      result.push({
        fractionId,
        parts: this.round(partsToAdd, 1)
      });
    }

    return result;
  }

  /**
   * Convert densities from kg/m³ to g/ml with rounding
   */
  private convertToGml(densities: { [key: string]: number }): { [key: string]: number } {
    const result: { [key: string]: number } = {};
    for (const [key, value] of Object.entries(densities)) {
      result[key] = this.round(value / 1000, 2);
    }
    return result;
  }

  /**
   * Round to specified decimal places
   */
  private round(value: number, decimals: number): number {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }
}

