import { Injectable } from '@nestjs/common';
import {
  MineralPhaseInput,
  MineralPhaseResult,
  MineralPhaseData,
  MineralPhaseMetadata,
} from '../interfaces/mineral-phase.interface';

/**
 * Mineral Phase Identifier Service
 * Ported from: legacy/refractory/src/calculators/MineralPhaseIdentifier.ts (252 lines)
 *
 * Identifies mineral phases in solid based on composition and temperature
 *
 * References:
 * - Kingery et al. (1976): Introduction to Ceramics, 2nd ed.
 * - Lee & Rainforth (1994): Ceramic Microstructures
 * - Schacht (2004): Refractories Handbook
 * - American Ceramic Society Phase Diagram Database
 *
 * Phase Identification Rules:
 * - Mullite (3Al₂O₃·2SiO₂): Primary phase in chamotte, Al2O3/SiO2 ratio 1.5-3.5
 * - Corundum (Al₂O₃): High alumina phases, >50% Al2O3
 * - Quartz (SiO₂): Free crystalline silica
 * - Cristobalite (SiO₂-β): High-temperature silica polymorph
 * - Gehlenite (2CaO·Al₂O₃·SiO₂): Calcium aluminate silicate
 * - Anorthite (CaO·Al₂O₃·2SiO₂): Calcium plagioclase feldspar
 * - Spinel (MgO·Al₂O₃): Magnesium aluminate
 * - Forsterite (2MgO·SiO₂): Magnesium silicate
 * - Magnetite (Fe₃O₄): Iron oxide, magnetic
 * - Wüstite (FeO): Iron(II) oxide
 * - Chromite (FeO·Cr₂O₃): Iron chromite
 * - Periclase (MgO): Magnesium oxide
 * - Zirconia (ZrO₂): Zirconium dioxide (monoclinic/tetragonal/cubic)
 * - Nepheline (NaAlSiO₄): Sodium aluminate silicate
 * - Tridymite (SiO₂): High-temperature silica polymorph
 * - β-Alumina (Na₂O·11Al₂O₃): Sodium beta alumina
 */
@Injectable()
export class MineralPhaseService {
  identifyPhases(solidComposition: Record<string, number>, temperature: number = 1400): Array<{ phase: string; formula: string; percent: number; meltingPoint: number; description: string }> {
    const phases: Array<{ phase: string; formula: string; percent: number; meltingPoint: number; description: string }> = [];

    // Extract all relevant oxides
    const Al2O3 = solidComposition.Al2O3 || 0;
    const SiO2 = solidComposition.SiO2 || 0;
    const CaO = solidComposition.CaO || 0;
    const MgO = solidComposition.MgO || 0;
    const Fe2O3 = solidComposition.Fe2O3 || 0;
    const FeO = solidComposition.FeO || 0;
    const Cr2O3 = solidComposition.Cr2O3 || 0;
    const ZrO2 = solidComposition.ZrO2 || 0;
    const Na2O = solidComposition.Na2O || 0;
    const K2O = solidComposition.K2O || 0;
    const TiO2 = solidComposition.TiO2 || 0;

    // ====================================================
    // ALUMINA PHASES
    // ====================================================
    const mullitePercent = this.estimateMullite(Al2O3, SiO2, temperature);
    if (mullitePercent > 1) phases.push({ phase: 'Mullite', formula: '3Al₂O₃·2SiO₂', percent: mullitePercent, meltingPoint: 1850, description: 'Primary refractory phase in clays and chamotte' });

    const corundumPercent = this.estimateCorundum(Al2O3, SiO2);
    if (corundumPercent > 1) phases.push({ phase: 'Corundum', formula: 'Al₂O₃', percent: corundumPercent, meltingPoint: 2054, description: 'Highly refractory alpha-alumina' });

    const betaAluminaPercent = this.estimateBetaAlumina(Na2O, Al2O3);
    if (betaAluminaPercent > 1) phases.push({ phase: 'β-Alumina', formula: 'Na₂O·11Al₂O₃', percent: betaAluminaPercent, meltingPoint: 1860, description: 'Sodium beta alumina, ionic conductor' });

    // ====================================================
    // SILICA PHASES
    // ====================================================
    const quartzPercent = this.estimateQuartz(SiO2, Al2O3, CaO);
    if (quartzPercent > 1) phases.push({ phase: 'Quartz', formula: 'SiO₂', percent: quartzPercent, meltingPoint: 1713, description: 'Low-temperature silica polymorph' });

    const cristobalitePercent = this.estimateCristobalite(SiO2, Al2O3, temperature);
    if (cristobalitePercent > 1) phases.push({ phase: 'Cristobalite', formula: 'SiO₂', percent: cristobalitePercent, meltingPoint: 1723, description: 'High-temperature silica polymorph (>268°C)' });

    const tridymitePercent = this.estimateTridymite(SiO2, Al2O3, temperature);
    if (tridymitePercent > 1) phases.push({ phase: 'Tridymite', formula: 'SiO₂', percent: tridymitePercent, meltingPoint: 1713, description: 'Highest temperature silica polymorph (>867°C)' });

    // ====================================================
    // CALCIUM SILICATES
    // ====================================================
    const gehlenitePercent = this.estimateGehlenite(CaO, Al2O3, SiO2);
    if (gehlenitePercent > 1) phases.push({ phase: 'Gehlenite', formula: '2CaO·Al₂O₃·SiO₂', percent: gehlenitePercent, meltingPoint: 1593, description: 'Calcium aluminate silicate (melilite)' });

    const anorthitePercent = this.estimateAnorthite(CaO, Al2O3, SiO2);
    if (anorthitePercent > 1) phases.push({ phase: 'Anorthite', formula: 'CaO·Al₂O₃·2SiO₂', percent: anorthitePercent, meltingPoint: 1553, description: 'Calcium plagioclase feldspar' });

    // ====================================================
    // MAGNESIUM PHASES
    // ====================================================
    const spinelPercent = this.estimateSpinel(MgO, Al2O3);
    if (spinelPercent > 1) phases.push({ phase: 'Spinel', formula: 'MgO·Al₂O₃', percent: spinelPercent, meltingPoint: 2135, description: 'Magnesium aluminate, high-strength refractory' });

    const forsteritePercent = this.estimateForsterite(MgO, SiO2);
    if (forsteritePercent > 1) phases.push({ phase: 'Forsterite', formula: '2MgO·SiO₂', percent: forsteritePercent, meltingPoint: 1890, description: 'Magnesium silicate, olivine structure' });

    const periclasePercent = this.estimatePericlase(MgO, CaO, SiO2);
    if (periclasePercent > 1) phases.push({ phase: 'Periclase', formula: 'MgO', percent: periclasePercent, meltingPoint: 2800, description: 'Magnesium oxide, highest melting oxide' });

    // ====================================================
    // IRON PHASES
    // ====================================================
    const magnetitePercent = this.estimateMagnetite(Fe2O3, FeO);
    if (magnetitePercent > 1) phases.push({ phase: 'Magnetite', formula: 'Fe₃O₄', percent: magnetitePercent, meltingPoint: 1538, description: 'Iron oxide, magnetic, oxidation product of FeO' });

    const wustitePercent = this.estimateWustite(FeO, Fe2O3);
    if (wustitePercent > 1) phases.push({ phase: 'Wustite', formula: 'FeO', percent: wustitePercent, meltingPoint: 1377, description: 'Iron(II) oxide, non-stoichiometric' });

    // ====================================================
    // CHROMITE PHASES
    // ====================================================
    const chromitePercent = this.estimateChromite(Cr2O3, FeO, Fe2O3);
    if (chromitePercent > 1) phases.push({ phase: 'Chromite', formula: '(Fe,Mg)O·Cr₂O₃', percent: chromitePercent, meltingPoint: 2180, description: 'Iron chromite, high-temperature stable' });

    // ====================================================
    // ZIRCONIUM PHASES
    // ====================================================
    const zirconiaPercent = this.estimateZirconia(ZrO2);
    if (zirconiaPercent > 1) phases.push({ phase: 'Zirconia', formula: 'ZrO₂', percent: zirconiaPercent, meltingPoint: 2715, description: 'Zirconium dioxide, monoclinic (>1170°C tetragonal, >2370°C cubic)' });

    // ====================================================
    // SILICATE PHASES
    // ====================================================
    const nephelinePercent = this.estimateNepheline(Na2O, Al2O3, SiO2);
    if (nephelinePercent > 1) phases.push({ phase: 'Nepheline', formula: 'NaAlSiO₄', percent: nephelinePercent, meltingPoint: 1525, description: 'Sodium aluminate silicate, feldspathoid' });

    return phases.length > 0 ? phases : [{ phase: 'Mixed solid solution', formula: '-', percent: 100, meltingPoint: 0, description: 'Mixed amorphous/glassy phases' }];
  }

  // ...existing methods...

  private estimateMullite(Al2O3: number, SiO2: number, temp: number): number {
    if (Al2O3 < 20 || SiO2 < 10) return 0;
    const ratio = Al2O3 / SiO2;
    if (ratio < 1.5 || ratio > 3.5) return 0;
    const ideal = 71.8;
    return Math.min(Al2O3, SiO2 * 1.5) * (ideal / 100);
  }

  private estimateCorundum(Al2O3: number, SiO2: number): number {
    if (Al2O3 < 50) return 0;
    const excessAl2O3 = Al2O3 - SiO2 * 1.5;
    return Math.max(0, excessAl2O3);
  }

  private estimateQuartz(SiO2: number, Al2O3: number, CaO: number): number {
    if (SiO2 < 20 || CaO > 10) return 0;
    const excessSiO2 = SiO2 - Al2O3 / 1.5;
    return Math.max(0, excessSiO2);
  }

  private estimateGehlenite(CaO: number, Al2O3: number, SiO2: number): number {
    if (CaO < 15 || Al2O3 < 10) return 0;
    return Math.min(CaO / 2, Al2O3, SiO2) * 0.8;
  }

  private estimateAnorthite(CaO: number, Al2O3: number, SiO2: number): number {
    if (CaO < 5 || Al2O3 < 15 || SiO2 < 20) return 0;
    return Math.min(CaO, Al2O3, SiO2 / 2) * 0.6;
  }

  private estimateSpinel(MgO: number, Al2O3: number): number {
    if (MgO < 10 || Al2O3 < 30) return 0;
    return Math.min(MgO, Al2O3 / 2) * 0.7;
  }

  private estimateBetaAlumina(Na2O: number, Al2O3: number): number {
    // β-Alumina: Na₂O·11Al₂O₃
    if (Na2O < 2 || Al2O3 < 50) return 0;
    return Math.min(Na2O / 0.18, Al2O3 / 11) * 12; // Approximate molar weight
  }

  private estimateCristobalite(SiO2: number, Al2O3: number, temp: number): number {
    // Cristobalite: high-T silica polymorph, forms above ~268°C
    if (SiO2 < 70 || Al2O3 > 20 || temp < 268) return 0;
    const excessSiO2 = SiO2 - Al2O3 / 1.5;
    return Math.max(0, excessSiO2 * 0.3);
  }

  private estimateTridymite(SiO2: number, Al2O3: number, temp: number): number {
    // Tridymite: highest-T silica polymorph, forms above ~867°C
    if (SiO2 < 80 || Al2O3 > 10 || temp < 867) return 0;
    const excessSiO2 = SiO2 - Al2O3 / 1.5;
    return Math.max(0, excessSiO2 * 0.15);
  }

  private estimateForsterite(MgO: number, SiO2: number): number {
    // Forsterite: 2MgO·SiO₂ (Mg₂SiO₄)
    if (MgO < 10 || SiO2 < 5) return 0;
    return Math.min(MgO / 2, SiO2) * (2 * 40 + 60) / 100; // Molar weight ~140
  }

  private estimatePericlase(MgO: number, CaO: number, SiO2: number): number {
    // Periclase: MgO (free magnesia, no bonding)
    if (MgO < 30 || CaO > 10 || SiO2 > 5) return 0;
    return Math.max(0, MgO - SiO2 * 1.2 - CaO * 0.5);
  }

  private estimateMagnetite(Fe2O3: number, FeO: number): number {
    // Magnetite: Fe₃O₄ = FeO·Fe₂O₃ (iron oxide spinel)
    if (Fe2O3 < 5 && FeO < 5) return 0;
    // Approximate: 1 part FeO + 1 part Fe2O3 → Magnetite
    return Math.min(Fe2O3 * 0.5, FeO * 0.5) * (232 / 160); // Molar weight conversion
  }

  private estimateWustite(FeO: number, Fe2O3: number): number {
    // Wustite: FeO (Fe₂⁺O)
    if (FeO < 5) return 0;
    // Excess FeO not converted to Fe2O3 or magnetite
    return Math.max(0, FeO - Fe2O3 * 1.2);
  }

  private estimateChromite(Cr2O3: number, FeO: number, Fe2O3: number): number {
    // Chromite: (Fe,Mg)O·Cr₂O₃
    if (Cr2O3 < 10 || (FeO + Fe2O3) < 10) return 0;
    const ironOxides = FeO + Fe2O3 * 0.8;
    return Math.min(Cr2O3, ironOxides * 0.5) * (232 / 152); // Molar weight ~232
  }

  private estimateZirconia(ZrO2: number): number {
    // Zirconia: ZrO₂ (appears at high purity)
    if (ZrO2 < 20) return 0;
    return ZrO2 * 0.95; // Assume most ZrO2 forms zirconia phase
  }

  private estimateNepheline(Na2O: number, Al2O3: number, SiO2: number): number {
    // Nepheline: NaAlSiO₄ (feldspathoid, forms with Na2O)
    if (Na2O < 5 || Al2O3 < 15 || SiO2 < 20) return 0;
    const limiting = Math.min(Na2O / 0.31, Al2O3 / 0.51, SiO2 / 0.27);
    return limiting * (142 / 100); // Molar weight ~142
  }
}

