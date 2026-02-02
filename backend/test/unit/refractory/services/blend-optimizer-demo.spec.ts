import { Test, TestingModule } from '@nestjs/testing';
import { BlendOptimizerService } from '../../../../src/modules/refractory/services/blend-optimizer.service';
import { PSDCalculatorService } from '../../../../src/modules/refractory/services/psd-calculator.service';
import { PackingService } from '../../../../src/modules/refractory/services/packing.service';
import { ShrinkageService } from '../../../../src/modules/refractory/services/shrinkage.service';
import { WaterDemandService } from '../../../../src/modules/refractory/services/water-demand.service';
import { ALL_MATERIALS } from '../../../../src/modules/refractory/data/materials-index';

// Helper function to find material by ID
const getMaterial = (materialId: string) => {
  const material = ALL_MATERIALS.find(m => m.materialId === materialId);
  if (!material) throw new Error(`Material ${materialId} not found in library`);
  return material;
};

// Helper function to create fraction from material
const createFraction = (materialId: string, particleSizeKey: string, options?: { isFixed?: boolean; massFraction?: number }) => {
  const material = getMaterial(materialId);

  // Particle size mapping (in mm)
  const particleSizes: Record<string, { dMin_mm: number; dMax_mm: number }> = {
    'ULTRAFINE': { dMin_mm: 0.0005, dMax_mm: 0.045 },
    'FINE_220MESH': { dMin_mm: 0.045, dMax_mm: 0.09 },
    'FINE_120MESH': { dMin_mm: 0.09, dMax_mm: 0.125 },
    'MEDIUM_120_30MESH': { dMin_mm: 0.125, dMax_mm: 0.5 },
    'MEDIUM_30_10MESH': { dMin_mm: 0.5, dMax_mm: 2.0 },
    'COARSE_10_6': { dMin_mm: 1.7, dMax_mm: 3.35 },
    'FINE': { dMin_mm: 0.001, dMax_mm: 0.5 },
    'MEDIUM': { dMin_mm: 0.5, dMax_mm: 2.0 },
    'COARSE': { dMin_mm: 2.0, dMax_mm: 6.0 },
  };

  const size = particleSizes[particleSizeKey];
  if (!size) throw new Error(`Particle size ${particleSizeKey} not defined`);

  return {
    materialId: material.materialId,
    dMin_mm: size.dMin_mm,
    dMax_mm: size.dMax_mm,
    density_kgm3: material.rho_true_after_firing_kgm3,
    composition: material.composition,
    isFixed: options?.isFixed,
    massFraction: options?.massFraction,
  };
};

describe('BlendOptimizerService - Live Demo', () => {
  let service: BlendOptimizerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlendOptimizerService,
        PSDCalculatorService,
        PackingService,
        ShrinkageService,
        WaterDemandService,
      ],
    }).compile();

    service = module.get<BlendOptimizerService>(BlendOptimizerService);
  });

  it('should demonstrate blend optimization with fixed fractions', () => {
    // ============================================================
    // SCENARIO 1: Maximum Density with Fixed Cement Fondu + Alumina
    // Real materials from library: fondu, alumina_calcined, chamotte_standard
    // ============================================================
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('SCENARIO 1: Maximum Density with Fixed Cement Fondu + Alumina');
    console.log('═══════════════════════════════════════════════════════════\n');

    const input1 = {
      fractions: [
        // 15% Ciment Fondu (fixed)
        createFraction('fondu', 'ULTRAFINE', { isFixed: true, massFraction: 0.15 }),

        // 15% Calcined Alumina 220 mesh (fixed)
        createFraction('alumina_calcined', 'FINE_220MESH', { isFixed: true, massFraction: 0.15 }),

        // Variable chamotte fractions (optimized)
        createFraction('chamotte_standard', 'FINE_120MESH'),
        createFraction('chamotte_standard', 'MEDIUM_120_30MESH'),
        createFraction('chamotte_standard', 'MEDIUM_30_10MESH'),
      ],
      options: {
        optimizationGoal: 'maxDensity' as const,
        topN: 3,
        minPackingEfficiency: 0.70,
      },
    };

    console.log('INPUT:');
    console.log(JSON.stringify(input1, null, 2));

    const results1 = service.optimize(input1);

    console.log('\nOUTPUT (Top 3 Results):');
    results1.forEach((result, index) => {
      console.log(`\n--- Result ${index + 1} (Rank ${result.rank}) ---`);
      console.log(`Optimization Score: ${result.optimizationScore}`);
      console.log(`Bulk Density: ${result.rhoBulk_gml_green} g/mL`);
      console.log(`Packing Efficiency: ${(result.packingEfficiency * 100).toFixed(1)}%`);
      console.log(`Porosity: ${result.porosity_percent_green}%`);
      console.log(`Water Demand: ${result.waterDemand_percent}%`);
      console.log(`Method: ${result.method}, q=${result.q}, Scenario: ${result.scenario}`);
      console.log(`Mass Fractions: [${result.massFractionsRoundedPercent.join('%, ')}%]`);
      console.log(`  - Ciment Fondu (fixed): ${result.massFractionsRoundedPercent[0]}%`);
      console.log(`  - Alumina 220 mesh (fixed): ${result.massFractionsRoundedPercent[1]}%`);
      console.log(`  - Chamotte <120 mesh: ${result.massFractionsRoundedPercent[2]}%`);
      console.log(`  - Chamotte 120-30 mesh: ${result.massFractionsRoundedPercent[3]}%`);
      console.log(`  - Chamotte 30-10 mesh: ${result.massFractionsRoundedPercent[4]}%`);
    });

    expect(results1).toHaveLength(3);
    expect(results1[0].rank).toBe(1);
    expect(results1[0].massFractionsRoundedPercent[0]).toBe(15); // Fondu fixed at 15%
    expect(results1[0].massFractionsRoundedPercent[1]).toBe(15); // Alumina fixed at 15%
  });

  it('should demonstrate minimum water optimization with constraints', () => {
    // ============================================================
    // SCENARIO 2: Minimum Water Demand
    // Real materials: silica fume, fondu, alumina_tabular
    // ============================================================
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('SCENARIO 2: Minimum Water with Real Materials from Library');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Check if silica fume exists, if not use microsilica or create generic
    const silicaMaterial = ALL_MATERIALS.find(m => m.materialId.includes('silica') && m.materialId.includes('fume'))
      || ALL_MATERIALS.find(m => m.name.toLowerCase().includes('microsilica'))
      || { materialId: 'silica_fume', rho_true_after_firing_kgm3: 2200, composition: { SiO2: 95, Al2O3: 1 } };

    const input2 = {
      fractions: [
        // 8% Silica Fume (fixed) - ultrafine
        {
          materialId: silicaMaterial.materialId,
          dMin_mm: 0.001,
          dMax_mm: 0.01,
          isFixed: true,
          massFraction: 0.08,
          density_kgm3: silicaMaterial.rho_true_after_firing_kgm3,
          composition: silicaMaterial.composition || { SiO2: 95 },
        },

        // 12% Ciment Fondu (fixed)
        createFraction('fondu', 'ULTRAFINE', { isFixed: true, massFraction: 0.12 }),

        // Variable tabular alumina fractions
        createFraction('alumina_tabular', 'FINE'),
        createFraction('alumina_tabular', 'COARSE'),
      ],
      options: {
        optimizationGoal: 'minWater' as const,
        topN: 5,
        maxWaterDemand: 12,
        maxPorosity: 28,
      },
    };

    console.log('INPUT:');
    console.log(JSON.stringify(input2, null, 2));

    const results2 = service.optimize(input2);

    console.log(`\nOUTPUT (Top ${results2.length} Results):`);
    results2.forEach((result, index) => {
      console.log(`\n--- Result ${index + 1} (Rank ${result.rank}) ---`);
      console.log(`Optimization Score: ${result.optimizationScore}`);
      console.log(`Water Demand: ${result.waterDemand_percent}% ✓ (goal: minimize)`);
      console.log(`Bulk Density: ${result.rhoBulk_gml_green} g/mL`);
      console.log(`Porosity: ${result.porosity_percent_green}%`);
      console.log(`Packing Efficiency: ${(result.packingEfficiency * 100).toFixed(1)}%`);
      console.log(`Method: ${result.method}, q=${result.q}`);
      console.log(`Mass Fractions: [${result.massFractionsRoundedPercent.join('%, ')}%]`);
      console.log(`  - Silica Fume (fixed): ${result.massFractionsRoundedPercent[0]}%`);
      console.log(`  - Ciment Fondu (fixed): ${result.massFractionsRoundedPercent[1]}%`);
      console.log(`  - Tabular Alumina Fine: ${result.massFractionsRoundedPercent[2]}%`);
      console.log(`  - Tabular Alumina Coarse: ${result.massFractionsRoundedPercent[3]}%`);
    });

    expect(results2.length).toBeGreaterThan(0);
    expect(results2.length).toBeLessThanOrEqual(5);
    expect(results2[0].rank).toBe(1);
    expect(results2[0].massFractionsRoundedPercent[0]).toBe(8); // Silica fixed at 8%
    expect(results2[0].massFractionsRoundedPercent[1]).toBe(12); // Fondu fixed at 12%
    results2.forEach(result => {
      expect(result.waterDemand_percent).toBeLessThanOrEqual(12);
      expect(result.porosity_percent_green).toBeLessThanOrEqual(28);
    });
  });

  it('should demonstrate balanced optimization', () => {
    // ============================================================
    // SCENARIO 3: Balanced Optimization with Chamotte
    // Real material: chamotte_standard
    // ============================================================
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('SCENARIO 3: Balanced Optimization with Chamotte from Library');
    console.log('═══════════════════════════════════════════════════════════\n');

    const input3 = {
      fractions: [
        // Three different size fractions of chamotte_standard
        createFraction('chamotte_standard', 'FINE'),
        createFraction('chamotte_standard', 'MEDIUM'),
        createFraction('chamotte_standard', 'COARSE'),
      ],
      options: {
        optimizationGoal: 'balanced' as const,
        topN: 5,
      },
    };

    console.log('INPUT:');
    console.log(JSON.stringify(input3, null, 2));

    const results3 = service.optimize(input3);

    console.log(`\nOUTPUT (Top ${results3.length} Results):`);
    results3.forEach((result, index) => {
      console.log(`\n--- Result ${index + 1} (Rank ${result.rank}) ---`);
      console.log(`Optimization Score: ${result.optimizationScore} (balanced)`);
      console.log(`Bulk Density: ${result.rhoBulk_gml_green} g/mL`);
      console.log(`Porosity: ${result.porosity_percent_green}%`);
      console.log(`Water Demand: ${result.waterDemand_percent}%`);
      console.log(`Packing Efficiency: ${(result.packingEfficiency * 100).toFixed(1)}%`);
      console.log(`Method: ${result.method}, q=${result.q}, Model: ${result.packingModel}`);
      console.log(`Mass Fractions: [${result.massFractionsRoundedPercent.join('%, ')}%]`);
      console.log(`  - Chamotte Fine: ${result.massFractionsRoundedPercent[0]}%`);
      console.log(`  - Chamotte Medium: ${result.massFractionsRoundedPercent[1]}%`);
      console.log(`  - Chamotte Coarse: ${result.massFractionsRoundedPercent[2]}%`);
      console.log(`Water Demand Range: ${result.waterDemandRange.min}% - ${result.waterDemandRange.max}%`);
    });

    expect(results3).toHaveLength(5);
    expect(results3[0].rank).toBe(1);
    // Scores can be equal or very similar when packing is near limits
    // This represents the viable range of compositions
    expect(results3[0].optimizationScore).toBeGreaterThanOrEqual(results3[1].optimizationScore!);

    // Log the score range to see the viable composition window
    const scores = results3.map(r => r.optimizationScore!);
    const scoreRange = Math.max(...scores) - Math.min(...scores);
    console.log(`\nScore range: ${scoreRange.toFixed(2)} (small range = wide composition window)`);
  });

  it('should demonstrate all optimization goals comparison', () => {
    // ============================================================
    // SCENARIO 4: Compare All Optimization Goals
    // ============================================================
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('SCENARIO 4: Compare All Optimization Goals');
    console.log('═══════════════════════════════════════════════════════════\n');

    const baseInput = {
      fractions: [
        { dMin_mm: 0.001, dMax_mm: 0.5, density_kgm3: 2700 },
        { dMin_mm: 0.5, dMax_mm: 2.0, density_kgm3: 2650 },
        { dMin_mm: 2.0, dMax_mm: 6.0, density_kgm3: 2600 },
      ],
    };

    const goals: Array<'maxDensity' | 'minPorosity' | 'minWater' | 'minShrinkage' | 'balanced'> = [
      'maxDensity',
      'minPorosity',
      'minWater',
      'minShrinkage',
      'balanced',
    ];

    console.log('INPUT (same for all goals):');
    console.log(JSON.stringify(baseInput, null, 2));

    console.log('\n\nCOMPARISON OF OPTIMIZATION GOALS:\n');
    console.log('Goal'.padEnd(20) + 'Score'.padEnd(12) + 'Density'.padEnd(12) + 'Porosity'.padEnd(12) + 'Water'.padEnd(12) + 'Method/q');
    console.log('─'.repeat(90));

    goals.forEach(goal => {
      const results = service.optimize({
        ...baseInput,
        options: { optimizationGoal: goal, topN: 1 },
      });

      const best = results[0];
      console.log(
        goal.padEnd(20) +
        best.optimizationScore!.toFixed(2).padEnd(12) +
        best.rhoBulk_gml_green.toFixed(2).padEnd(12) +
        `${best.porosity_percent_green}%`.padEnd(12) +
        `${best.waterDemand_percent}%`.padEnd(12) +
        `${best.method}/${best.q}`
      );
    });

    console.log('\n');
  });

  it('should demonstrate viable composition ranges (similar scores)', () => {
    // ============================================================
    // SCENARIO 5: Viable Composition Ranges
    // When packing is near limits, small composition changes don't affect results
    // This gives us a RANGE of acceptable formulations
    // ============================================================
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('SCENARIO 5: Viable Composition Ranges');
    console.log('═══════════════════════════════════════════════════════════\n');

    const input = {
      fractions: [
        createFraction('chamotte_standard', 'FINE'),
        createFraction('chamotte_standard', 'MEDIUM'),
        createFraction('chamotte_standard', 'COARSE'),
      ],
      options: {
        optimizationGoal: 'maxDensity' as const,
        topN: 10,  // Get top 10 to see the range
        minPackingEfficiency: 0.65,
      },
    };

    console.log('INPUT:');
    console.log(JSON.stringify(input, null, 2));

    const results = service.optimize(input);

    console.log(`\nOUTPUT: Analyzing top ${results.length} formulations\n`);

    // Group results by similar scores (within 1% difference)
    const scoreThreshold = 0.01;  // 1% difference
    const groups: any[][] = [];

    results.forEach(result => {
      const existingGroup = groups.find(g =>
        Math.abs(g[0].optimizationScore! - result.optimizationScore!) < scoreThreshold
      );

      if (existingGroup) {
        existingGroup.push(result);
      } else {
        groups.push([result]);
      }
    });

    console.log(`Found ${groups.length} groups of similar-performing formulations:\n`);

    groups.forEach((group, groupIndex) => {
      console.log(`Group ${groupIndex + 1}: ${group.length} formulations (score ≈ ${group[0].optimizationScore!.toFixed(2)})`);

      // Find composition range for this group
      const fractionRanges = [0, 1, 2].map(fractionIndex => {
        const fractions = group.map(r => r.massFractionsRoundedPercent[fractionIndex]);
        return {
          min: Math.min(...fractions),
          max: Math.max(...fractions),
          avg: fractions.reduce((a, b) => a + b, 0) / fractions.length,
        };
      });

      console.log(`  Fine range: ${fractionRanges[0].min}-${fractionRanges[0].max}% (avg: ${fractionRanges[0].avg.toFixed(0)}%)`);
      console.log(`  Medium range: ${fractionRanges[1].min}-${fractionRanges[1].max}% (avg: ${fractionRanges[1].avg.toFixed(0)}%)`);
      console.log(`  Coarse range: ${fractionRanges[2].min}-${fractionRanges[2].max}% (avg: ${fractionRanges[2].avg.toFixed(0)}%)`);
      console.log(`  Density range: ${Math.min(...group.map(r => r.rhoBulk_gml_green)).toFixed(2)} - ${Math.max(...group.map(r => r.rhoBulk_gml_green)).toFixed(2)} g/mL`);
      console.log('');
    });

    console.log('Key Insight:');
    console.log('When packing is near φ_max, composition variations of ±2-5% may produce');
    console.log('identical or very similar results. This defines the VIABLE RANGE.');
    console.log('Engineers can adjust within this range based on:');
    console.log('  - Material availability');
    console.log('  - Cost optimization');
    console.log('  - Processing requirements');
    console.log('');

    // Verify we got results
    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(10);

    // Verify grouping found at least one group
    expect(groups.length).toBeGreaterThan(0);

    // If we have multiple formulations with similar scores, that's expected and good!
    if (groups[0].length > 1) {
      console.log(`✓ Found ${groups[0].length} formulations with similar performance`);
      console.log(`  This represents the viable composition window!\n`);
    }
  });
});

