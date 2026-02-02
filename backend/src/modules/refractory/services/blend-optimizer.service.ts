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

            // Calculate water demand based on packing result
            const waterDemandStandard = this.waterDemand.calculateWaterDemand(
              packingResult.packingFraction_phi
            );
            const waterDemandRange = this.waterDemand.calculateWaterDemandRange(
              packingResult.packingFraction_phi
            );

            const shrinkageResult = this.shrinkageService.calculateCompleteShrinkage({
              materials: [],
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

    this.logger.log(`Blend optimization complete: ${results.length} results generated`);
    return results;
  }


  private calculateSkeletalDensity(densities: number[], massFractions: number[]): number {
    return densities.reduce((sum, d, i) => sum + d * massFractions[i], 0);
  }
}
