import type { CrystalIdentificationRule } from '../types/crystal-identification-rule.type';

/**
 * Threshold heuristics for crystalline phases of an oxide solid
 * (same thresholds as the legacy `identifyMineralPhases`, plus a silica rule).
 * Sources: Levin et al. (1964) Phase Diagrams for Ceramists; Kingery et al. (1976).
 */
export const CRYSTAL_IDENTIFICATION_RULES: ReadonlyArray<CrystalIdentificationRule> = [
  { phaseId: 'corundum', phase: 'Corundum', formula: 'Al2O3', minWt: { Al2O3: 50 }, weightOxide: 'Al2O3' },
  {
    phaseId: 'mullite', phase: 'Mullite', formula: '3Al2O3·2SiO2',
    minWt: { Al2O3: 30, SiO2: 20 },
    minRatio: { numerator: 'Al2O3', denominator: 'SiO2', value: 1.5 },
    weightOxide: 'SiO2',
  },
  { phaseId: 'cristobalite', phase: 'Cristobalite', formula: 'SiO2', minWt: { SiO2: 70 }, weightOxide: 'SiO2' },
  {
    phaseId: 'anorthite', phase: 'Anorthite', formula: 'CaO·Al2O3·2SiO2',
    minWt: { CaO: 5, Al2O3: 15, SiO2: 20 }, weightOxide: 'CaO',
  },
  {
    phaseId: 'gehlenite', phase: 'Gehlenite', formula: '2CaO·Al2O3·SiO2',
    minWt: { CaO: 15, Al2O3: 10, SiO2: 5 }, weightOxide: 'CaO',
  },
  { phaseId: 'spinel', phase: 'Spinel', formula: 'MgAl2O4', minWt: { MgO: 10, Al2O3: 30 }, weightOxide: 'MgO' },
  { phaseId: 'forsterite', phase: 'Forsterite', formula: '2MgO·SiO2', minWt: { MgO: 20, SiO2: 15 }, weightOxide: 'MgO' },
];
