/**
 * Mineral Phase Identifier
 * Identifies mineral phases in solid based on composition and temperature
 *
 * References:
 * - Kingery et al. (1976): Introduction to Ceramics, 2nd ed.
 * - Lee & Rainforth (1994): Ceramic Microstructures
 * - Schacht (2004): Refractories Handbook
 */

import { MineralPhase, OxideComposition } from '../types';
import { GlassViscosityCalculator } from './GlassViscosityCalculator';

export class MineralPhaseIdentifier {
  private glassViscCalc: GlassViscosityCalculator;

  constructor() {
    this.glassViscCalc = new GlassViscosityCalculator();
  }
  /**
   * Identify mineral phases in solid composition
   */
  public identifyPhases(
    solidComposition: OxideComposition,
    temperature: number
  ): MineralPhase[] {
    const phases: MineralPhase[] = [];

    const Al2O3 = solidComposition.Al2O3 || 0;
    const SiO2 = solidComposition.SiO2 || 0;
    const CaO = solidComposition.CaO || 0;

    // Mullite (3Al₂O₃·2SiO₂) - Primary phase in chamotte
    const mullitePercent = this.estimateMullite(Al2O3, SiO2, temperature);
    if (mullitePercent > 1) {
      phases.push({
        phase: 'Mullite',
        formula: '3Al₂O₃·2SiO₂',
        percent: mullitePercent,
        meltingPoint: 1850,
        description: 'Primary refractory phase, stable needle-like crystals'
      });
    }

    // Corundum (Al₂O₃) - High alumina phases
    const corundumPercent = this.estimateCorundum(Al2O3, SiO2, temperature);
    if (corundumPercent > 1) {
      phases.push({
        phase: 'Corundum',
        formula: 'Al₂O₃',
        percent: corundumPercent,
        meltingPoint: 2054,
        description: 'Highly refractory alumina crystals'
      });
    }

    // Quartz (SiO₂) - Free silica
    const quartzPercent = this.estimateQuartz(SiO2, Al2O3, CaO, temperature);
    if (quartzPercent > 1) {
      phases.push({
        phase: 'Quartz',
        formula: 'SiO₂',
        percent: quartzPercent,
        meltingPoint: 1713,
        description: 'Crystalline silica'
      });
    }

    // Gehlenite (2CaO·Al₂O₃·SiO₂) - Calcium aluminate silicate
    const gehlenitePercent = this.estimateGehlenite(CaO, Al2O3, SiO2, temperature);
    if (gehlenitePercent > 1) {
      phases.push({
        phase: 'Gehlenite',
        formula: '2CaO·Al₂O₃·SiO₂',
        percent: gehlenitePercent,
        meltingPoint: 1593,
        description: 'Calcium aluminate silicate phase'
      });
    }

    // Anorthite (CaO·Al₂O₃·2SiO₂) - Calcium plagioclase
    const anorthitePercent = this.estimateAnorthite(CaO, Al2O3, SiO2, temperature);
    if (anorthitePercent > 1) {
      phases.push({
        phase: 'Anorthite',
        formula: 'CaO·Al₂O₃·2SiO₂',
        percent: anorthitePercent,
        meltingPoint: 1553,
        description: 'Calcium-rich plagioclase feldspar'
      });
    }

    // Calcium aluminates (CA, CA₂, CA₆) - From cement
    const caPercent = this.estimateCalciumAluminates(CaO, Al2O3, temperature);
    if (caPercent > 1) {
      phases.push({
        phase: 'Calcium Aluminates',
        formula: 'CaO·Al₂O₃ (+ CA₂, CA₆)',
        percent: caPercent,
        meltingPoint: 1605,
        description: 'Calcium aluminate phases from cement'
      });
    }

    // Amorphous/glassy phase
    const totalCrystalline = phases.reduce((sum, p) => sum + p.percent, 0);
    if (totalCrystalline < 98) {
      const glassPercent = 100 - totalCrystalline;

      // Calculate glass composition (approximate from solid composition)
      const glassComposition = this.estimateGlassComposition(solidComposition);

      // Calculate viscosity fixed points for the glass
      const viscosityPoints = this.glassViscCalc.calculateFixedPoints(glassComposition);

      phases.push({
        phase: 'Amorphous',
        formula: 'Glass',
        percent: glassPercent,
        meltingPoint: 0, // Glass doesn't have a sharp melting point
        description: 'Non-crystalline glassy phase',
        viscosityPoints: viscosityPoints
      });
    }

    // Normalize to 100%
    return this.normalizePhases(phases);
  }

  /**
   * Estimate glass composition from solid composition
   * Glass is enriched in network formers and modifiers
   */
  private estimateGlassComposition(solidComposition: OxideComposition): OxideComposition {
    // Glass phase is typically enriched in SiO2 and depleted in Al2O3
    return {
      SiO2: (solidComposition.SiO2 || 0) * 1.1,
      Al2O3: (solidComposition.Al2O3 || 0) * 0.9,
      CaO: (solidComposition.CaO || 0) * 1.2,
      MgO: (solidComposition.MgO || 0) * 1.1,
      Na2O: (solidComposition.Na2O || 0) * 1.3,
      K2O: (solidComposition.K2O || 0) * 1.3,
      Fe2O3: (solidComposition.Fe2O3 || 0) * 1.0,
      TiO2: (solidComposition.TiO2 || 0) * 1.0
    };
  }

  /**
   * Estimate mullite content
   */
  private estimateMullite(Al2O3: number, SiO2: number, temperature: number): number {
    // Mullite is 3Al₂O₃·2SiO₂ (71.8% Al₂O₃, 28.2% SiO₂)
    // Forms from chamotte, stable below 1850°C

    if (temperature > 1850) return 0;

    // Estimate based on stoichiometry
    const Al2O3_for_mullite = Al2O3 * 0.6; // ~60% of Al₂O₃ in mullite
    const SiO2_for_mullite = SiO2 * 0.4;   // ~40% of SiO₂ in mullite

    const mullite_from_Al2O3 = Al2O3_for_mullite / 0.718;
    const mullite_from_SiO2 = SiO2_for_mullite / 0.282;

    // Limited by whichever is less
    return Math.min(mullite_from_Al2O3, mullite_from_SiO2, 70);
  }

  /**
   * Estimate corundum content
   */
  private estimateCorundum(Al2O3: number, SiO2: number, temperature: number): number {
    // Corundum is pure Al₂O₃
    // Forms from high-alumina materials, stable below 2054°C

    if (temperature > 2000) return 0;

    // Excess Al₂O₃ after mullite formation
    const excessAl2O3 = Al2O3 - (SiO2 * 2.55); // Stoichiometric for mullite

    return Math.max(0, excessAl2O3 * 0.8);
  }

  /**
   * Estimate quartz content
   */
  private estimateQuartz(SiO2: number, Al2O3: number, CaO: number, temperature: number): number {
    // Free SiO₂, melts at 1713°C

    if (temperature > 1713) return SiO2 * 0.1; // Most melted

    // Excess SiO₂ after mullite and calcium silicate formation
    const usedInMullite = Al2O3 * 0.28 / 0.718; // SiO₂ in mullite
    const usedInCaSilicates = CaO * 0.5; // Rough estimate

    const freeQuartz = SiO2 - usedInMullite - usedInCaSilicates;

    return Math.max(0, Math.min(freeQuartz, SiO2 * 0.3));
  }

  /**
   * Estimate gehlenite content
   */
  private estimateGehlenite(CaO: number, _Al2O3: number, _SiO2: number, temperature: number): number {
    // 2CaO·Al₂O₃·SiO₂ (40.9% CaO, 27.7% Al₂O₃, 31.4% SiO₂)
    // Forms at intermediate temperatures

    if (temperature > 1593) return CaO * 0.2; // Partially melted
    if (temperature < 1300) return CaO * 0.6; // More stable

    return CaO * 0.4;
  }

  /**
   * Estimate anorthite content
   */
  private estimateAnorthite(CaO: number, _Al2O3: number, _SiO2: number, temperature: number): number {
    // CaO·Al₂O₃·2SiO₂ (20.1% CaO, 36.7% Al₂O₃, 43.2% SiO₂)

    if (temperature > 1553) return CaO * 0.1; // Mostly melted

    return CaO * 0.3;
  }

  /**
   * Estimate calcium aluminate content
   */
  private estimateCalciumAluminates(CaO: number, _Al2O3: number, temperature: number): number {
    // CA, CA₂, CA₆ from cement
    // CaO·Al₂O₃ melts at 1605°C

    if (CaO < 5) return 0; // Not enough CaO
    if (temperature > 1605) return CaO * 0.2;

    return Math.min(CaO * 0.5, 15);
  }

  /**
   * Normalize phase percentages to 100%
   */
  private normalizePhases(phases: MineralPhase[]): MineralPhase[] {
    const total = phases.reduce((sum, p) => sum + p.percent, 0);

    if (total === 0) return phases;

    return phases.map(p => ({
      ...p,
      percent: (p.percent / total) * 100
    }));
  }
}

