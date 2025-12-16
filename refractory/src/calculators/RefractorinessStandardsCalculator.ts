/**
 * Refractoriness Standards Calculator
 * Implements multiple models for predicting standard refractoriness points
 *
 * Standards:
 * - EN ISO 1893: Refractoriness Under Load (RUL) - T₀.₅, T₁, T₂ at 0.2 MPa
 * - ASTM C24/C71: Pyrometric Cone Equivalent (PCE)
 * - GOST 4069-69: Refractoriness point based on cone softening
 *
 * References:
 * - EN ISO 1893:2015 - Refractory materials - Determination of refractoriness-under-load
 * - ASTM C24-10: Standard Test Method for Pyrometric Cone Equivalent (PCE)
 * - Giordano et al. (2008): Viscosity of magmatic liquids
 * - Hsieh (2004): Einstein-Roscoe equation for effective viscosity
 * - Decterov & Pelton (2012): CALPHAD-based viscosity modeling
 */

import { OxideComposition } from '../types';
import { GlassViscosityCalculator } from './GlassViscosityCalculator';

/**
 * Refractoriness point with model used
 */
export interface RefractorinessPoint {
  criterion: string;           // 'T0.5', 'T1', 'T2', 'PCE', 'GOST_Cone'
  temperature: number;         // °C
  modelUsed: string;           // Model identifier
  confidence: string;          // 'High', 'Medium', 'Low'
  notes?: string;
}

/**
 * Deformation prediction result
 */
export interface DeformationPrediction {
  temperature: number;         // °C
  liquidFraction: number;      // 0-1
  liquidViscosity: number;     // Pa·s
  effectiveViscosity: number;  // Pa·s
  strainRate: number;          // s⁻¹
  cumulativeStrain: number;    // 0-1
}

/**
 * Multi-model evaluation result
 */
export interface MultiModelResult {
  points: RefractorinessPoint[];
  deformationCurve: DeformationPrediction[];
  modelsSummary: {
    modelA: string;  // Phase calculation
    modelB: string;  // Viscosity prediction
    modelC: string;  // Mechanical deformation
    modelD: string;  // Effective viscosity
  };
}

export class RefractorinessStandardsCalculator {
  private glassViscCalc: GlassViscosityCalculator;

  // Physical constants
  private readonly GAS_CONSTANT = 8.314; // J/(mol·K)
  private readonly STRESS = 0.2e6; // Pa (0.2 MPa per EN ISO 1893)

  constructor() {
    this.glassViscCalc = new GlassViscosityCalculator();
  }

  /**
   * Calculate all refractoriness points using multiple models
   *
   * @param composition Oxide composition (wt.%)
   * @param liquidFractionFunc Function to get liquid fraction at temperature
   * @param heatingRate Heating rate in °C/min (default 5 per EN ISO 1893)
   * @param porosity Porosity fraction 0-1
   */
  public calculateMultiModel(
    composition: OxideComposition,
    liquidFractionFunc: (temp: number) => number,
    heatingRate: number = 5
  ): MultiModelResult {

    const points: RefractorinessPoint[] = [];
    const deformationCurve: DeformationPrediction[] = [];

    // Temperature range for evaluation
    const tempStart = 1200;
    const tempEnd = 1800;
    const tempStep = 10;

    let cumulativeStrain = 0;
    let foundT05 = false;
    let foundT1 = false;
    let foundT2 = false;

    // Model C: Mechanical deformation (RUL)
    for (let T = tempStart; T <= tempEnd; T += tempStep) {
      const liquidFraction = liquidFractionFunc(T);

      // Calculate liquid viscosity (Model B)
      const liquidViscosity = this.glassViscCalc.calculateViscosity(composition, T);

      // Calculate effective viscosity (Model D)
      const effectiveViscosity = this.calculateEffectiveViscosity(
        liquidViscosity,
        liquidFraction
      );

      // Calculate strain rate (Model C)
      const strainRate = this.calculateStrainRate(
        T,
        liquidFraction,
        liquidViscosity,
        effectiveViscosity,
        composition
      );

      // Integrate strain over time step
      const timeStep = (tempStep / heatingRate) * 60; // seconds
      cumulativeStrain += strainRate * timeStep;

      deformationCurve.push({
        temperature: T,
        liquidFraction,
        liquidViscosity,
        effectiveViscosity,
        strainRate,
        cumulativeStrain
      });

      // Check EN ISO 1893 criteria
      if (!foundT05 && cumulativeStrain >= 0.005) {
        points.push({
          criterion: 'T₀.₅',
          temperature: T,
          modelUsed: 'Model C: Viscous flow + solid creep',
          confidence: 'High',
          notes: `0.5% deformation under 0.2 MPa (EN ISO 1893)`
        });
        foundT05 = true;
      }

      if (!foundT1 && cumulativeStrain >= 0.01) {
        points.push({
          criterion: 'T₁',
          temperature: T,
          modelUsed: 'Model C: Viscous flow + solid creep',
          confidence: 'High',
          notes: `1% deformation under 0.2 MPa (EN ISO 1893)`
        });
        foundT1 = true;
      }

      if (!foundT2 && cumulativeStrain >= 0.02) {
        points.push({
          criterion: 'T₂',
          temperature: T,
          modelUsed: 'Model C: Viscous flow + solid creep',
          confidence: 'High',
          notes: `2% deformation under 0.2 MPa (EN ISO 1893)`
        });
        foundT2 = true;
      }
    }

    // Model D: PCE (ASTM C24) - cone softening
    const pceTemp = this.estimatePCE(composition, deformationCurve);
    points.push({
      criterion: 'PCE',
      temperature: pceTemp,
      modelUsed: 'Model D: Einstein-Roscoe effective viscosity',
      confidence: 'Medium',
      notes: `Pyrometric Cone Equivalent (ASTM C24/C71)`
    });

    // GOST 4069-69 - cone softening without viscosity criterion
    const gostTemp = this.estimateGOST(composition, deformationCurve);
    points.push({
      criterion: 'GOST Cone',
      temperature: gostTemp,
      modelUsed: 'Model D: Cone deformation analysis',
      confidence: 'Medium',
      notes: `GOST 4069-69 cone softening temperature`
    });

    return {
      points,
      deformationCurve,
      modelsSummary: {
        modelA: 'Phase calculation: Selective melting with eutectic approach',
        modelB: 'Viscosity: Giordano et al. (2008) VFT for silicate melts',
        modelC: 'RUL: Viscous flow + solid creep under 0.2 MPa',
        modelD: 'Effective viscosity: Einstein-Roscoe equation (Hsieh 2004)'
      }
    };
  }

  /**
   * Model C: Calculate strain rate from viscous flow and solid creep
   *
   * Reference: EN ISO 1893, Norton creep law for refractories
   * ε̇(T) = ε̇_solid(T) + (σ · φ_eff(T)) / η_liq(T)
   */
  private calculateStrainRate(
    temperature: number,
    liquidFraction: number,
    _liquidViscosity: number,
    effectiveViscosity: number,
    composition: OxideComposition
  ): number {

    // Solid creep component (Norton law)
    const solidCreepRate = this.calculateSolidCreep(temperature, composition);

    // Viscous flow component
    let viscousFlowRate = 0;
    if (liquidFraction > 0.001) {
      // Effective stress considering liquid connectivity
      const effectiveStress = this.STRESS * this.calculateStressConcentration(liquidFraction);
      viscousFlowRate = effectiveStress / effectiveViscosity;
    }

    return solidCreepRate + viscousFlowRate;
  }

  /**
   * Calculate solid creep rate using Norton law
   *
   * Reference: Norton (1929), Kingery et al. (1976)
   * ε̇ = A·σⁿ·exp(-Q/RT)
   */
  private calculateSolidCreep(temperature: number, composition: OxideComposition): number {
    const T_K = temperature + 273.15;

    // Material-dependent parameters
    const Al2O3 = (composition.Al2O3 || 0) / 100;

    // Activation energy (kJ/mol) - higher for Al2O3-rich materials
    const Q = 300 + Al2O3 * 200; // 300-500 kJ/mol typical for refractories

    // Pre-exponential factor (depends on microstructure)
    const A = 1e-10; // Typical value for ceramic materials

    // Stress exponent (n = 1 for diffusion creep, n = 3-5 for dislocation creep)
    const n = 3; // Intermediate value

    const creepRate = A * Math.pow(this.STRESS, n) * Math.exp(-Q * 1000 / (this.GAS_CONSTANT * T_K));

    return creepRate;
  }

  /**
   * Model D: Calculate effective viscosity using Einstein-Roscoe equation
   *
   * Reference: Hsieh (2004), Roscoe (1952)
   * η_eff = η_liq · (1 - φ_solid)^(-n)
   * where n ≈ 2.5 for spherical particles
   */
  private calculateEffectiveViscosity(
    liquidViscosity: number,
    liquidFraction: number
  ): number {

    const solidFraction = 1 - liquidFraction;

    // Maximum packing fraction (0.64 for random packing)
    const phi_max = 0.64;

    // Einstein-Roscoe exponent
    const n = 2.5;

    // Critical solid fraction for percolation
    if (solidFraction < 0.01) {
      return liquidViscosity; // Essentially pure liquid
    }

    if (solidFraction > phi_max) {
      // Beyond maximum packing - use very high viscosity
      return liquidViscosity * 1e6;
    }

    // Einstein-Roscoe equation
    const effectiveViscosity = liquidViscosity * Math.pow(1 - solidFraction / phi_max, -n);

    return Math.min(effectiveViscosity, 1e15); // Cap at practical maximum
  }

  /**
   * Calculate stress concentration factor due to liquid phase
   *
   * Reference: Raj & Ashby (1971) - cavity growth in creep
   */
  private calculateStressConcentration(liquidFraction: number): number {
    // Stress concentration increases as liquid forms interconnected network
    if (liquidFraction < 0.05) {
      return 1.0; // Isolated liquid pockets
    } else if (liquidFraction < 0.15) {
      return 1.0 + (liquidFraction - 0.05) * 5; // Linear increase
    } else {
      return 1.5 + liquidFraction * 2; // Interconnected liquid network
    }
  }

  /**
   * Model D: Estimate PCE (Pyrometric Cone Equivalent) temperature
   *
   * Reference: ASTM C24-10
   * Cone bends when effective viscosity reaches ~10^6 Pa·s
   */
  private estimatePCE(
    composition: OxideComposition,
    deformationCurve: DeformationPrediction[]
  ): number {

    // PCE criterion: effective viscosity ~10^6 Pa·s (empirical)
    const targetViscosity = 1e6;

    for (const point of deformationCurve) {
      if (point.effectiveViscosity <= targetViscosity && point.liquidFraction > 0.15) {
        return point.temperature;
      }
    }

    // Fallback: use high liquid fraction (>30%) as indicator
    for (const point of deformationCurve) {
      if (point.liquidFraction >= 0.30) {
        return point.temperature;
      }
    }

    // Ultimate fallback: estimate from composition
    return this.estimateFromComposition(composition, 'PCE');
  }

  /**
   * Estimate GOST cone softening temperature
   *
   * Reference: GOST 4069-69
   * Based on cone deformation without specific viscosity criterion
   */
  private estimateGOST(
    composition: OxideComposition,
    deformationCurve: DeformationPrediction[]
  ): number {

    // GOST criterion: significant deformation (>5%) or 20% liquid
    for (const point of deformationCurve) {
      if (point.cumulativeStrain >= 0.05 || point.liquidFraction >= 0.20) {
        return point.temperature;
      }
    }

    // Fallback: composition-based estimate
    return this.estimateFromComposition(composition, 'GOST');
  }

  /**
   * Composition-based estimation (fallback method)
   *
   * Reference: Empirical correlations from refractory handbooks
   */
  private estimateFromComposition(composition: OxideComposition, criterion: string): number {
    const Al2O3 = composition.Al2O3 || 0;
    const SiO2 = composition.SiO2 || 0;
    const CaO = composition.CaO || 0;
    const Fe2O3 = composition.Fe2O3 || 0;

    // Base temperature
    let baseTemp = 1400;

    // Al2O3 increases refractoriness
    baseTemp += Al2O3 * 4.0;

    // SiO2 moderately increases
    baseTemp += SiO2 * 2.0;

    // Fluxes decrease refractoriness
    baseTemp -= CaO * 8.0;
    baseTemp -= Fe2O3 * 5.0;

    // Adjust for specific criterion
    if (criterion === 'PCE') {
      baseTemp -= 50; // PCE typically lower than refractoriness
    } else if (criterion === 'GOST') {
      baseTemp -= 30; // GOST cone similar to PCE
    }

    return Math.max(1200, Math.min(1800, Math.round(baseTemp)));
  }

  /**
   * Generate validation report comparing models
   */
  public generateValidationReport(result: MultiModelResult): string {
    let report = '=== Multi-Model Refractoriness Prediction ===\n\n';

    report += '**Models Applied:**\n';
    report += `Model A: ${result.modelsSummary.modelA}\n`;
    report += `Model B: ${result.modelsSummary.modelB}\n`;
    report += `Model C: ${result.modelsSummary.modelC}\n`;
    report += `Model D: ${result.modelsSummary.modelD}\n\n`;

    report += '**Predicted Points:**\n';
    report += '| Criterion | Temperature | Model Used | Confidence | Notes |\n';
    report += '|-----------|-------------|------------|------------|-------|\n';

    for (const point of result.points) {
      report += `| ${point.criterion} | ${point.temperature}°C | ${point.modelUsed} | ${point.confidence} | ${point.notes || '-'} |\n`;
    }

    report += '\n**Validation Notes:**\n';
    report += '- Compare with experimental RUL curves\n';
    report += '- Verify cone test results against PCE prediction\n';
    report += '- Document heating rate and atmosphere used\n';

    return report;
  }
}

