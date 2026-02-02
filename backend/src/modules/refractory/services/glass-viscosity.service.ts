import { Injectable } from '@nestjs/common';
import {
  calculateViscosityEffect,
  getComponentEffect,
} from '../data/component-properties';
import {
  GlassViscosityInput,
  GlassViscosityResult,
  ASTMFixedPoint,
  GlassViscosityMetadata,
} from '../interfaces/glass-viscosity.interface';

/**
 * Glass Viscosity Calculator Service
 * Ported from: legacy/refractory/src/calculators/GlassViscosityCalculator.ts (284 lines)
 *
 * Calculates viscosity and fixed points for amorphous/glassy phases
 * Updated to support ALL 33 components (oxides, fluorides, chlorides)
 * using the same Arrhenius model and component-properties system as ViscosityService
 *
 * Model: η = A × exp(B/T)
 * where:
 * - η: viscosity (Pa·s)
 * - A: pre-exponential factor (for glass: 0.001)
 * - B: activation energy/R (composition-dependent from component-properties.ts)
 * - T: absolute temperature (K)
 *
 * References:
 * - ASTM C965-96: Standard Practice for Measuring Viscosity of Glass Above the Softening Point
 * - Lakatos et al. (1972): Viscosity temperature relations in the glass system SiO₂-Al₂O₃-Na₂O-K₂O-CaO-MgO
 * - Giordano et al. (2008): Viscosity of magmatic liquids: A model, Earth Planet. Sci. Lett.
 * - Urbain et al. (1982): Viscosity of silicate melts
 *
 * ASTM C965-96 Fixed Points (Note: ASTM defines in poise. Conversion: 1 Pa·s = 10 poise):
 * - Melting Point: 10 poise = 1 Pa·s - liquid, homogenization
 * - Flow Point: 10⁵ poise = 10⁴ Pa·s - upper working limit
 * - Working Point: 10⁴ poise = 10³ Pa·s - glass working temperature
 * - Softening Point: 10^7.6 poise = 10^6.6 Pa·s - Littleton softening point
 * - Annealing Point: 10^13 poise = 10^12 Pa·s - upper glass transition
 * - Strain Point: 10^14.5 poise = 10^13.5 Pa·s - lower glass transition
 *
 * Component Support: All 33 components
 * - 8 Oxide Network Formers
 * - 14 Oxide Network Modifiers
 * - 6 Fluoride components
 * - 6 Chloride components
 */
@Injectable()
export class GlassViscosityService {
  // Base parameters for glass systems
  private readonly A_BASE = 0.001; // Pre-exponential factor
  private readonly B_BASE = 10000; // Base activation energy/R (K)
  /**
   * Calculate glass viscosity using Arrhenius model with all 33 components
   *
   * Uses the same component-properties system as ViscosityService:
   * - All 33 components automatically included
   * - Viscosity effects from component-properties.ts
   * - Consistent physics across both services
   *
   * @param composition Record with component formulas as keys and weight percentages as values
   * @param temperature Temperature in °C
   * @returns Viscosity data including Pa·s, ASTM fixed points, and component breakdown
   */
  calculateViscosity(composition: Record<string, number>, temperature: number) {
    const T_K = temperature + 273.15;

    let A = this.A_BASE;
    let B = this.B_BASE;

    // Use helper function to calculate viscosity effect from ALL 33 components at once
    // This automatically loops through composition and applies viscosity effects
    const effectFromComponents = calculateViscosityEffect(composition);
    B += effectFromComponents;

    // Calculate viscosity using Arrhenius equation
    let viscosity = A * Math.exp(B / T_K);

    // Clamp viscosity to physically meaningful range
    viscosity = Math.max(0.001, Math.min(1e15, viscosity));

    const logViscosity = Math.log10(viscosity);

    return {
      viscosity_Pas: Number(viscosity.toFixed(3)),
      temperature_C: temperature,
      logViscosity: Number(logViscosity.toFixed(2)),
      arrhenius_A: A,
      arrhenius_B: B,
      // ASTM C965-96 fixed points (in °C)
      softening_Point_C: this.estimateSofteningPoint(composition),
      workingPoint_C: this.estimateWorkingPoint(composition),
      annealing_Point_C: this.estimateAnnealingPoint(composition),
      strain_Point_C: this.estimateStrainPoint(composition),
      // Component breakdown for verification
      components: {
        networkFormers: this.extractNetworkFormers(composition),
        networkModifiers: this.extractNetworkModifiers(composition),
        fluorides: this.extractFluorideComponents(composition),
        chlorides: this.extractChlorideComponents(composition),
      },
    };
  }

  /**
   * Estimate softening point (ASTM C965-96: 10^7.6 poise = 10^6.6 Pa·s)
   * Temperature at which glass deforms under specified load
   */
  private estimateSofteningPoint(comp: Record<string, number>): number {
    const SiO2 = comp.SiO2 || 0;
    const Al2O3 = comp.Al2O3 || 0;
    const CaO = comp.CaO || 0;
    const Na2O = comp.Na2O || 0;
    const K2O = comp.K2O || 0;
    const networkFormers = SiO2 + Al2O3;
    const networkModifiers = CaO + Na2O + K2O;

    // Base softening point from network formers and modifiers
    let softeningPoint = 600 + networkFormers * 8 - networkModifiers * 3;

    // Additional effects from other components
    const B2O3 = comp.B2O3 || 0;
    const MgO = comp.MgO || 0;
    const Fe2O3 = comp.Fe2O3 || 0;
    const Cr2O3 = comp.Cr2O3 || 0;

    softeningPoint -= B2O3 * 5; // Borate glass - lower softening point
    softeningPoint += MgO * 4; // MgO increases softening point
    softeningPoint += Fe2O3 * 2; // Fe2O3 slightly increases
    softeningPoint += Cr2O3 * 3; // Cr2O3 slightly increases

    return Math.max(400, Math.min(1000, softeningPoint));
  }

  /**
   * Estimate working point (ASTM C965-96: 10⁴ poise = 10³ Pa·s)
   * Typical working temperature for glass forming
   */
  private estimateWorkingPoint(comp: Record<string, number>): number {
    return this.estimateSofteningPoint(comp) + 100;
  }

  /**
   * Estimate annealing point (ASTM C965-96: 10^13 poise = 10^12 Pa·s)
   * Upper glass transition region
   */
  private estimateAnnealingPoint(comp: Record<string, number>): number {
    return this.estimateSofteningPoint(comp) - 150;
  }

  /**
   * Estimate strain point (ASTM C965-96: 10^14.5 poise = 10^13.5 Pa·s)
   * Lower glass transition region
   */
  private estimateStrainPoint(comp: Record<string, number>): number {
    return this.estimateAnnealingPoint(comp) - 50;
  }

  /**
   * Extract network former components (oxides that increase viscosity)
   */
  private extractNetworkFormers(composition: Record<string, number>): Array<{ component: string; percentage: number; effect: number }> {
    const formers = ['SiO2', 'Al2O3', 'CR2O3', 'ZRO2', 'TIO2', 'B2O3', 'GEO2'];
    return formers
      .filter(c => (composition[c] || 0) > 0)
      .map(c => ({
        component: c,
        percentage: composition[c] || 0,
        effect: getComponentEffect(c)?.viscosityEffect || 0,
      }));
  }

  /**
   * Extract network modifier components (oxides that decrease viscosity)
   */
  private extractNetworkModifiers(composition: Record<string, number>): Array<{ component: string; percentage: number; effect: number }> {
    const modifiers = ['NA2O', 'K2O', 'LI2O', 'PBO', 'CAO', 'BAO', 'SRO', 'MNO', 'FEO', 'FE2O3', 'COO', 'NIO', 'CUO', 'MGO'];
    return modifiers
      .filter(c => (composition[c] || 0) > 0)
      .map(c => ({
        component: c,
        percentage: composition[c] || 0,
        effect: getComponentEffect(c)?.viscosityEffect || 0,
      }));
  }

  /**
   * Extract fluoride components
   */
  private extractFluorideComponents(composition: Record<string, number>): Array<{ component: string; percentage: number; effect: number }> {
    const fluorides = ['NAF', 'KF', 'LIF', 'CAF2', 'MGF2', 'ALF3'];
    return fluorides
      .filter(c => (composition[c] || 0) > 0)
      .map(c => ({
        component: c,
        percentage: composition[c] || 0,
        effect: getComponentEffect(c)?.viscosityEffect || 0,
      }));
  }

  /**
   * Extract chloride components
   */
  private extractChlorideComponents(composition: Record<string, number>): Array<{ component: string; percentage: number; effect: number }> {
    const chlorides = ['NACL', 'KCL', 'CACL2', 'MGCL2', 'FECL2', 'FECL3'];
    return chlorides
      .filter(c => (composition[c] || 0) > 0)
      .map(c => ({
        component: c,
        percentage: composition[c] || 0,
        effect: getComponentEffect(c)?.viscosityEffect || 0,
      }));
  }
}

