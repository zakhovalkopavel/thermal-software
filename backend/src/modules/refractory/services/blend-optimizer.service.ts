import { Injectable, Logger } from '@nestjs/common';
import { PSDCalculatorService } from './psd-calculator.service';
import { PackingService } from './packing.service';
import { ShrinkageService } from './shrinkage.service';
import { WaterDemandService } from './water-demand.service';
import {
  DEFAULT_Q_VALUES,
  PSD_METHODS,
  PACKING_MODELS,
  COMPACTION_SCENARIOS,
  DEFAULT_TEMPERATURE_PROFILE_C,
  DEFAULT_WATER_CEMENT_RATIO,
  DEFAULT_MATERIAL_DENSITY_KGM3,
  getCompactionIndex,
  getCompactionPressure,
} from '../constants/blend-optimizer.constants';
import {
  BlendOptimizationRequest,
  BlendOptimizationOptions,
  Fraction,
  BlendOptimizationResult,
  BlendOptimizationResults,
} from '../interfaces/blend-optimizer.interface';

/**
 * Blend Optimizer Service
 * Ported from: legacy/refractory/src/calculators/BlendOptimizer.ts (346 lines)
 *
 * Optimizes particle size distribution blends using multiple methods and scenarios.
 * Integrates PSD calculation, packing models, and shrinkage prediction for complete
 * refractory blend characterization.
 *
 * References:
 * - de Larrard, F. (1999) "Concrete Mixture Proportioning"
 * - Funk & Dinger (1994) "Predictive Process Control"
 * - Banerjee, S. (2004) "Monolithic Refractories"
 *
 * Workflow:
 * 1. Calculate optimal PSD (Andreasen or Funk-Dinger)
 * 2. Calculate packing density (CPM or Furnas)
 * 3. Calculate skeletal and bulk densities
 * 4. Predict shrinkage at multiple temperatures
 * 5. Calculate final properties (density, porosity, water absorption)
 * 6. Determine flowability category
 *
 * Scenarios:
 * - Self-compacting: minimal compaction, q ≤ 0.26
 * - Flowable: low compaction, q ≤ 0.29
 * - Vibratable: medium compaction, q ≤ 0.32
 * - Hand-pressable: high compaction, q > 0.32
 */
@Injectable()
export class BlendOptimizerService {
  private readonly logger = new Logger(BlendOptimizerService.name);

  constructor(
    private readonly psdCalculator: PSDCalculatorService,
    private readonly packingService: PackingService,
    private readonly shrinkageService: ShrinkageService,
    private readonly waterDemand: WaterDemandService,
  ) {}

  /**
   * Optimize particle size distribution blend
   *
   * @param request Blend optimization request with fractions and options
   * @returns Array of optimization results for all tested combinations
   */
  optimize(request: BlendOptimizationRequest): BlendOptimizationResult[] {
    const { fractions, options = {} } = request;
    const {
      qValues = DEFAULT_Q_VALUES,
      methods = PSD_METHODS as any,
      packingModels = PACKING_MODELS as any,
      scenarios = COMPACTION_SCENARIOS as any,
      temperatureProfile_C = DEFAULT_TEMPERATURE_PROFILE_C,
      waterCementRatio = DEFAULT_WATER_CEMENT_RATIO,
      optimizationGoal = 'balanced',
      topN,
      minPackingEfficiency,
      maxWaterDemand,
      maxPorosity,
      autoExpandRanges = false,
      rangeSimilarityThreshold = 0.01,
    } = options;

    const results: BlendOptimizationResult[] = [];

    for (const method of methods) {
      for (const q of qValues) {
        for (const scenario of scenarios) {
          let psdResult;
          if (method === 'Andreasen') {
            psdResult = this.psdCalculator.andreasenDiscrete(fractions, q);
          } else {
            psdResult = this.psdCalculator.funkDingerDiscrete(fractions, q);
          }

          for (const packingModel of packingModels) {
            const densities = fractions.map(f => f.density_kgm3 || DEFAULT_MATERIAL_DENSITY_KGM3);
            const diameters = fractions.map(f => (f.dMin_mm + f.dMax_mm) / 2);

            const packingResult = packingModel === 'CPM'
              ? this.packingService.calculateCPM({
                  massFractions: psdResult.massFractions,
                  densities_kgm3: densities,
                  diameters_mm: diameters,
                  compactionPressure_MPa: getCompactionPressure(scenario),
                }, { K: getCompactionIndex(scenario) })
              : this.packingService.calculateFurnas({
                  massFractions: psdResult.massFractions,
                  densities_kgm3: densities,
                  diameters_mm: diameters,
                });

            const rhoSkeletal = this.calculateSkeletalDensity(densities, psdResult.massFractions);
            const rhoBulk_green = rhoSkeletal * packingResult.packingFraction_phi;

            const waterDemandStandard = this.waterDemand.calculateWaterDemand(
              packingResult.packingFraction_phi
            );
            const waterDemandRange = this.waterDemand.calculateWaterDemandRange(
              packingResult.packingFraction_phi
            );

            // Create materials array matching massFractions length
            // Use material properties from fractions
            const materials = psdResult.massFractions.map((_, index) => {
              const fraction = fractions[index];
              return {
                name: fraction?.materialId || `Material_${index + 1}`,
                composition: (fraction as any)?.composition || {},  // Use composition from fraction if available
              };
            });

            const shrinkageResult = this.shrinkageService.calculateCompleteShrinkage({
              materials,
              massFractions: psdResult.massFractions,
              temperatureProfile_C,
              waterCementRatio,
              cementContent: 0.1,
            });

            results.push({
              method: psdResult.method,
              q,
              scenario,
              packingModel,
              massFractions: psdResult.massFractions,
              massFractionsRoundedPercent: psdResult.massFractionsRoundedPercent,
              rhoSkeletal_gml: Number((rhoSkeletal / 1000).toFixed(2)),
              rhoBulk_gml_green: Number((rhoBulk_green / 1000).toFixed(2)),
              packingEfficiency: packingResult.packingFraction_phi,
              porosity_percent_green: Number(((1 - packingResult.packingFraction_phi) * 100).toFixed(1)),
              waterDemand_percent: waterDemandStandard,
              waterDemandRange: {
                min: waterDemandRange.min,
                typical: waterDemandRange.typical,
                max: waterDemandRange.max,
              },
              shrinkage: shrinkageResult,
            });
          }
        }
      }
    }

    // Apply filters
    let filteredResults = this.applyConstraints(results, {
      minPackingEfficiency,
      maxWaterDemand,
      maxPorosity,
    });

    // Calculate optimization scores and rank
    filteredResults = this.calculateScoresAndRank(filteredResults, optimizationGoal);

    // AUTO-EXPAND: If viable ranges detected, explore more combinations
    if (autoExpandRanges && filteredResults.length > 1) {
      const viableRanges = this.detectViableRanges(filteredResults, rangeSimilarityThreshold);

      if (viableRanges.length > 0 && viableRanges[0].formulations.length > 1) {
        this.logger.log(`🎯 Viable range detected! Expanding search to map boundaries...`);

        // Expand q values around the best performing range
        const expandedResults = this.expandSearchAroundRange(
          request,
          viableRanges[0],
          optimizationGoal
        );

        // Merge and re-rank
        filteredResults = this.calculateScoresAndRank(
          [...filteredResults, ...expandedResults],
          optimizationGoal
        );
      }
    }

    // Return top N if specified
    if (topN && topN > 0) {
      filteredResults = filteredResults.slice(0, topN);
    }

    this.logger.log(`Blend optimization complete: ${filteredResults.length} results (from ${results.length} total, goal: ${optimizationGoal})`);
    return filteredResults;
  }

  /**
   * Detect viable composition ranges (groups with similar scores)
   *
   * @param results - Array of optimization results
   * @param threshold - Score similarity threshold (single value or array per component)
   * @returns Array of viable ranges sorted by score
   */
  private detectViableRanges(
    results: BlendOptimizationResult[],
    threshold: number | number[]
  ): Array<{ score: number; formulations: BlendOptimizationResult[] }> {
    const ranges: Array<{ score: number; formulations: BlendOptimizationResult[] }> = [];

    // Use simple score-based grouping (threshold is for composition, not score)
    // For score grouping, use a fixed threshold of 1% of the best score
    const scoreThreshold = results.length > 0 ? (results[0].optimizationScore || 0) * 0.01 : 0.01;

    results.forEach(result => {
      const existingRange = ranges.find(r =>
        Math.abs(r.score - (result.optimizationScore || 0)) < scoreThreshold
      );

      if (existingRange) {
        existingRange.formulations.push(result);
      } else {
        ranges.push({
          score: result.optimizationScore || 0,
          formulations: [result],
        });
      }
    });

    // Sort by score (best first)
    ranges.sort((a, b) => b.score - a.score);

    return ranges;
  }

  /**
   * Expand search around a viable range to map its boundaries
   */
  private expandSearchAroundRange(
    request: BlendOptimizationRequest,
    range: { score: number; formulations: BlendOptimizationResult[] },
    optimizationGoal: string
  ): BlendOptimizationResult[] {
    const { fractions } = request;

    // Find q values used in this range
    const qValuesInRange = [...new Set(range.formulations.map(f => f.q))];

    // Generate additional q values around the range (finer granularity)
    const expandedQValues: number[] = [];
    qValuesInRange.forEach(q => {
      expandedQValues.push(q - 0.01, q + 0.01, q - 0.02, q + 0.02);
    });

    // Filter to valid range and remove duplicates
    const uniqueQValues = [...new Set(expandedQValues)]
      .filter(q => q >= 0.20 && q <= 0.40)
      .sort((a, b) => a - b);

    this.logger.log(`Expanding with ${uniqueQValues.length} additional q values: [${uniqueQValues.map(q => q.toFixed(2)).join(', ')}]`);

    // Generate new results with expanded q values
    const expandedResults: BlendOptimizationResult[] = [];

    // Use the method and scenario from the best formulation in range
    const bestInRange = range.formulations[0];
    const method = bestInRange.method;
    const scenario = bestInRange.scenario;
    const packingModel = bestInRange.packingModel;

    for (const q of uniqueQValues) {
      let psdResult;
      if (method === 'Andreasen') {
        psdResult = this.psdCalculator.andreasenDiscrete(fractions, q);
      } else {
        psdResult = this.psdCalculator.funkDingerDiscrete(fractions, q);
      }

      const densities = fractions.map(f => f.density_kgm3 || DEFAULT_MATERIAL_DENSITY_KGM3);
      const diameters = fractions.map(f => (f.dMin_mm + f.dMax_mm) / 2);

      const packingResult = packingModel === 'CPM'
        ? this.packingService.calculateCPM({
            massFractions: psdResult.massFractions,
            densities_kgm3: densities,
            diameters_mm: diameters,
            compactionPressure_MPa: getCompactionPressure(scenario),
          }, { K: getCompactionIndex(scenario) })
        : this.packingService.calculateFurnas({
            massFractions: psdResult.massFractions,
            densities_kgm3: densities,
            diameters_mm: diameters,
          });

      const rhoSkeletal = this.calculateSkeletalDensity(densities, psdResult.massFractions);
      const rhoBulk_green = rhoSkeletal * packingResult.packingFraction_phi;

      const waterDemandStandard = this.waterDemand.calculateWaterDemand(
        packingResult.packingFraction_phi
      );
      const waterDemandRange = this.waterDemand.calculateWaterDemandRange(
        packingResult.packingFraction_phi
      );

      const materials = psdResult.massFractions.map((_, index) => {
        const fraction = fractions[index];
        return {
          name: fraction?.materialId || `Material_${index + 1}`,
          composition: (fraction as any)?.composition || {},
        };
      });

      const shrinkageResult = this.shrinkageService.calculateCompleteShrinkage({
        materials,
        massFractions: psdResult.massFractions,
        temperatureProfile_C: request.options?.temperatureProfile_C || DEFAULT_TEMPERATURE_PROFILE_C,
        waterCementRatio: request.options?.waterCementRatio || DEFAULT_WATER_CEMENT_RATIO,
        cementContent: 0.1,
      });

      expandedResults.push({
        method: psdResult.method,
        q,
        scenario,
        packingModel,
        massFractions: psdResult.massFractions,
        massFractionsRoundedPercent: psdResult.massFractionsRoundedPercent,
        rhoSkeletal_gml: Number((rhoSkeletal / 1000).toFixed(2)),
        rhoBulk_gml_green: Number((rhoBulk_green / 1000).toFixed(2)),
        packingEfficiency: packingResult.packingFraction_phi,
        porosity_percent_green: Number(((1 - packingResult.packingFraction_phi) * 100).toFixed(1)),
        waterDemand_percent: waterDemandStandard,
        waterDemandRange: {
          min: waterDemandRange.min,
          typical: waterDemandRange.typical,
          max: waterDemandRange.max,
        },
        shrinkage: shrinkageResult,
      });
    }

    return expandedResults;
  }

  /**
   * Apply constraint filters to results
   */
  private applyConstraints(
    results: BlendOptimizationResult[],
    constraints: {
      minPackingEfficiency?: number;
      maxWaterDemand?: number;
      maxPorosity?: number;
    }
  ): BlendOptimizationResult[] {
    let filtered = results;

    if (constraints.minPackingEfficiency !== undefined) {
      filtered = filtered.filter(r => r.packingEfficiency >= constraints.minPackingEfficiency!);
    }

    if (constraints.maxWaterDemand !== undefined) {
      filtered = filtered.filter(r => r.waterDemand_percent <= constraints.maxWaterDemand!);
    }

    if (constraints.maxPorosity !== undefined) {
      filtered = filtered.filter(r => r.porosity_percent_green <= constraints.maxPorosity!);
    }

    return filtered;
  }

  /**
   * Calculate optimization scores and rank results
   */
  private calculateScoresAndRank(
    results: BlendOptimizationResult[],
    goal: 'maxDensity' | 'minPorosity' | 'minWater' | 'minShrinkage' | 'balanced'
  ): BlendOptimizationResult[] {
    // Calculate scores based on goal
    const scoredResults = results.map(result => {
      let score: number;

      // Get max shrinkage from total shrinkage
      const maxShrinkage = Math.max(...(result.shrinkage.total?.shrinkage_volumetric_percent || [0]));

      switch (goal) {
        case 'maxDensity':
          score = result.rhoBulk_gml_green;
          break;

        case 'minPorosity':
          score = 100 - result.porosity_percent_green;
          break;

        case 'minWater':
          score = 50 - result.waterDemand_percent;
          break;

        case 'minShrinkage':
          score = 100 - maxShrinkage;
          break;

        case 'balanced':
        default:
          // Balanced: normalize and combine multiple factors
          const densityScore = result.rhoBulk_gml_green / 3.5 * 100; // Normalize to ~100
          const porosityScore = 100 - result.porosity_percent_green;
          const waterScore = (50 - result.waterDemand_percent) / 50 * 100;
          const shrinkageScore = 100 - maxShrinkage;

          score = (densityScore + porosityScore + waterScore + shrinkageScore) / 4;
          break;
      }

      return {
        ...result,
        optimizationScore: Number(score.toFixed(2)),
      };
    });

    // Sort by score (highest first)
    scoredResults.sort((a, b) => (b.optimizationScore || 0) - (a.optimizationScore || 0));

    // Assign ranks
    return scoredResults.map((result, index) => ({
      ...result,
      rank: index + 1,
    }));
  }

  private calculateSkeletalDensity(densities: number[], massFractions: number[]): number {
    return densities.reduce((sum, d, i) => sum + d * massFractions[i], 0);
  }
}
