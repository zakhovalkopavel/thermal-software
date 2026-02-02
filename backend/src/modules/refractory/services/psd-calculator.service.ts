import { Injectable, BadRequestException } from '@nestjs/common';
import {
  PSDFraction,
  PSDCalculationRequest,
  PSDResult,
  PSDValidationResult,
} from '../interfaces/psd-calculator.interface';

/**
 * Particle Size Distribution Calculator Service
 * Ported from: legacy/refractory/src/calculators/PSDCalculator.ts (445 lines)
 *
 * Implements optimal PSD models for refractory castables and concretes:
 * - Andreasen (Fuller-Andreasen packing law)
 * - Funk-Dinger modification
 *
 * References:
 * - Andreasen, A.A. (1930) "Über die Beziehung zwischen Kornabstufung und Zwischenraum"
 * - Fuller, W.B. & Thompson, S.E. (1907) "The Laws of Proportioning Concrete"
 * - Funk, J.E. & Dinger, D.R. (1994) "Predictive Process Control of Crowded Particulate Suspensions"
 *   https://www.springer.com/gp/book/9780792329680
 *
 * Key Features:
 * - Discrete PSD calculation for size fractions
 * - Fixed fraction support (allows locking specific fractions)
 * - Variable fraction optimization
 * - Automatic Dmin/Dmax determination
 */
@Injectable()
export class PSDCalculatorService {
  /**
   * Calculate Andreasen discrete PSD
   *
   * Formula: P(D) = (D^q - Dmin^q) / (Dmax^q - Dmin^q)
   *
   * @param fractions Array of particle size fractions
   * @param q Distribution modulus (typically 0.2-0.4, lower = more fines)
   * @param Dmin_mm Minimum diameter (optional, auto-calculated if not provided)
   * @param Dmax_mm Maximum diameter (optional, auto-calculated if not provided)
   * @returns PSD result with mass fractions
   */
  andreasenDiscrete(fractions: Array<{ dMin_mm: number; dMax_mm: number; isFixed?: boolean; massFraction?: number }>, q: number, Dmin_mm?: number, Dmax_mm?: number) {
    this.validateInputs(fractions, q);
    const fixedFractions = fractions.filter(f => f.isFixed);
    const variableFractions = fractions.filter(f => !f.isFixed);
    const totalFixed = fixedFractions.reduce((sum, f) => sum + (f.massFraction || 0), 0);
    if (totalFixed >= 1) throw new BadRequestException('Fixed fractions must be < 100%');
    if (variableFractions.length === 0) throw new BadRequestException('Need at least one variable fraction');
    const remainingPercent = 1 - totalFixed;
    const sorted = [...variableFractions].sort((a, b) => a.dMin_mm - b.dMin_mm);
    const calcDmin = Dmin_mm ?? sorted[0].dMin_mm;
    const calcDmax = Dmax_mm ?? sorted[sorted.length - 1].dMax_mm;
    if (calcDmin >= calcDmax) throw new BadRequestException('Dmin must be < Dmax');
    const calculateP = (D: number): number => calcDmin === 0 ? Math.pow(D / calcDmax, q) : (Math.pow(D, q) - Math.pow(calcDmin, q)) / (Math.pow(calcDmax, q) - Math.pow(calcDmin, q));
    const variableMassFractions = sorted.map(f => calculateP(f.dMax_mm) - calculateP(f.dMin_mm));
    const sum = variableMassFractions.reduce((acc, val) => acc + val, 0);
    const normalized = variableMassFractions.map(mf => (mf / sum) * remainingPercent);
    const combinedMassFractions: number[] = [];
    for (const fraction of fractions) {
      if (fraction.isFixed) combinedMassFractions.push(fraction.massFraction || 0);
      else combinedMassFractions.push(normalized[sorted.findIndex(vf => vf === fraction)]);
    }
    return { method: 'Andreasen', q, massFractions: combinedMassFractions, massFractionsRoundedPercent: this.roundToIntegerPercent(combinedMassFractions), Dmin_mm: calcDmin, Dmax_mm: calcDmax };
  }

  /**
   * Calculate Funk-Dinger discrete PSD
   *
   * Modification of Andreasen formula with improved fine particle distribution.
   * Funk-Dinger uses same formula as modified Andreasen with Dmin > 0, but recommends
   * Dmin = 0.001 mm or smallest measurable particle size for better fine particle packing.
   *
   * This results in more realistic packing for systems with very fine particles.
   *
   * @param fractions Array of particle size fractions
   * @param q Distribution modulus (typically 0.2-0.4)
   * @param Dmin_mm Minimum diameter (recommended: 0.001 mm or smallest measurable)
   * @param Dmax_mm Maximum diameter (optional, auto-calculated if not provided)
   * @returns PSD result with mass fractions
   */
  funkDingerDiscrete(fractions: Array<{ dMin_mm: number; dMax_mm: number; isFixed?: boolean; massFraction?: number }>, q: number, Dmin_mm?: number, Dmax_mm?: number) {
    this.validateInputs(fractions, q);
    const fixedFractions = fractions.filter(f => f.isFixed);
    const variableFractions = fractions.filter(f => !f.isFixed);
    const totalFixed = fixedFractions.reduce((sum, f) => sum + (f.massFraction || 0), 0);
    if (totalFixed >= 1) throw new BadRequestException('Fixed fractions must be < 100%');
    if (variableFractions.length === 0) throw new BadRequestException('Need at least one variable fraction');
    const remainingPercent = 1 - totalFixed;
    const sorted = [...variableFractions].sort((a, b) => a.dMin_mm - b.dMin_mm);
    const calcDmin = Dmin_mm ?? Math.max(0.001, sorted[0].dMin_mm * 0.01);
    const calcDmax = Dmax_mm ?? sorted[sorted.length - 1].dMax_mm;
    const calculateP = (D: number): number => (Math.pow(D, q) - Math.pow(calcDmin, q)) / (Math.pow(calcDmax, q) - Math.pow(calcDmin, q));
    const variableMassFractions = sorted.map(f => calculateP(f.dMax_mm) - calculateP(f.dMin_mm));
    const sum = variableMassFractions.reduce((acc, val) => acc + val, 0);
    const normalized = variableMassFractions.map(mf => (mf / sum) * remainingPercent);
    const combinedMassFractions: number[] = [];
    for (const fraction of fractions) {
      if (fraction.isFixed) combinedMassFractions.push(fraction.massFraction || 0);
      else combinedMassFractions.push(normalized[sorted.findIndex(vf => vf === fraction)]);
    }
    return { method: 'FunkDinger', q, massFractions: combinedMassFractions, massFractionsRoundedPercent: this.roundToIntegerPercent(combinedMassFractions), Dmin_mm: calcDmin, Dmax_mm: calcDmax };
  }

  private validateInputs(fractions: any[], q: number): void {
    if (!fractions || fractions.length === 0) throw new BadRequestException('Fractions array cannot be empty');
    if (q <= 0 || q > 1) throw new BadRequestException('q must be between 0 and 1');
  }

  private roundToIntegerPercent(massFractions: number[]): number[] {
    const percentages = massFractions.map(mf => Math.round(mf * 100));
    const sum = percentages.reduce((acc, val) => acc + val, 0);
    if (sum !== 100 && percentages.length > 0) percentages[0] += (100 - sum);
    return percentages;
  }
}

