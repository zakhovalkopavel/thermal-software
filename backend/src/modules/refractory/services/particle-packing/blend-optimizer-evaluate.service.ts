import { Injectable } from '@nestjs/common';
import { BLEND_OPTIMIZER_CONSTANTS } from '../../constants/blend-optimizer.constants';
import type { BlendOptimizationResult, Fraction } from '../../types';
import { BlendOptimizerScenarios } from '../../utils/blend-optimizer-scenarios';
import { PackingService } from './packing.service';
import { PSDCalculatorService } from './psd-calculator.service';
import { ShrinkageService } from '../thermal/shrinkage.service';
import { WaterDemandService } from './water-demand.service';

/**
 * Evaluates one (method, q, scenario, packingModel) combination for blend optimization.
 */
@Injectable()
export class BlendOptimizerEvaluateService {
  constructor(
    private readonly psdCalculator: PSDCalculatorService,
    private readonly packingService: PackingService,
    private readonly shrinkageService: ShrinkageService,
    private readonly waterDemand: WaterDemandService,
  ) {}

  evaluate(params: {
    fractions: Fraction[];
    method: string;
    q: number;
    scenario: string;
    packingModel: string;
    temperatureProfile_C: number[];
    waterCementRatio: number;
  }): BlendOptimizationResult {
    const {
      fractions,
      method,
      q,
      scenario,
      packingModel,
      temperatureProfile_C,
      waterCementRatio,
    } = params;

    const psdResult = method === 'Andreasen'
      ? this.psdCalculator.andreasenDiscrete(fractions, q)
      : this.psdCalculator.funkDingerDiscrete(fractions, q);

    const densities = fractions.map(
      f => f.density_kgm3 || BLEND_OPTIMIZER_CONSTANTS.DEFAULT_MATERIAL_DENSITY_KGM3,
    );
    const diameters = fractions.map(f => (f.dMin_mm + f.dMax_mm) / 2);

    const packingResult = packingModel === 'CPM'
      ? this.packingService.calculateCPM(
          {
            massFractions: psdResult.massFractions,
            densities_kgm3: densities,
            diameters_mm: diameters,
            compactionPressure_MPa: BlendOptimizerScenarios.compactionPressure(scenario),
          },
          // Composition-aware φ_max / β (micro-fillers). Scenario K is the CPM
          // process index (4.1–6), not the β₀ formula coefficient — do not pass it as K.
          { autoDetectMaxPhi: true },
        )
      : this.packingService.calculateFurnas({
          massFractions: psdResult.massFractions,
          densities_kgm3: densities,
          diameters_mm: diameters,
        });

    const rhoSkeletal = BlendOptimizerEvaluateService.skeletalDensity(
      densities,
      psdResult.massFractions,
    );
    const rhoBulk_green = rhoSkeletal * packingResult.packingFraction_phi;

    const waterDemandStandard = this.waterDemand.calculateWaterDemand(
      packingResult.packingFraction_phi,
    );
    const waterDemandRange = this.waterDemand.calculateWaterDemandRange(
      packingResult.packingFraction_phi,
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
      temperatureProfile_C,
      waterCementRatio,
      cementContent: 0.1,
    });

    return {
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
    };
  }

  static skeletalDensity(densities: number[], massFractions: number[]): number {
    return densities.reduce((sum, d, i) => sum + d * massFractions[i], 0);
  }
}
