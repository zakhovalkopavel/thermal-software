import type { CalphadCandidateSolid } from '../types/calphad-candidate-solid.type';

/**
 * Stoichiometric solids spannable by common refractory oxides.
 * Compound ids point at `shared/processed/compound-data` entries with usable G(T).
 */
export const CALPHAD_CANDIDATE_SOLIDS: readonly CalphadCandidateSolid[] = [
  { phaseId: 'corundum', phase: 'Corundum', formula: 'Al2O3', compoundId: 'aluminium_oxide', oxides: { Al2O3: 1 } },
  { phaseId: 'quartz', phase: 'Quartz', formula: 'SiO2', compoundId: 'silica', oxides: { SiO2: 1 } },
  { phaseId: 'lime', phase: 'Lime', formula: 'CaO', compoundId: 'lime', oxides: { CaO: 1 } },
  { phaseId: 'periclase', phase: 'Periclase', formula: 'MgO', compoundId: 'magnesium_oxide', oxides: { MgO: 1 } },
  {
    phaseId: 'mullite',
    phase: 'Mullite',
    formula: 'Al6Si2O13',
    compoundId: 'Aluminum_Silicate,_Mullite',
    oxides: { Al2O3: 3, SiO2: 2 },
  },
  {
    phaseId: 'gehlenite',
    phase: 'Gehlenite',
    formula: 'Ca2Al2SiO7',
    compoundId: 'gehlenite',
    oxides: { CaO: 2, Al2O3: 1, SiO2: 1 },
  },
  {
    phaseId: 'anorthite',
    phase: 'Anorthite',
    formula: 'CaAl2Si2O8',
    compoundId: 'CaO·Al2O3·2SiO2',
    oxides: { CaO: 1, Al2O3: 1, SiO2: 2 },
  },
  {
    phaseId: 'wollastonite',
    phase: 'Wollastonite',
    formula: 'CaSiO3',
    compoundId: 'CaO·SiO2',
    oxides: { CaO: 1, SiO2: 1 },
  },
  {
    phaseId: 'rankinite',
    phase: 'Rankinite',
    formula: 'Ca3Si2O7',
    compoundId: 'rankinite',
    oxides: { CaO: 3, SiO2: 2 },
  },
  {
    phaseId: 'larnite',
    phase: 'Larnite',
    formula: 'Ca2SiO4',
    compoundId: 'calcio-olivine',
    oxides: { CaO: 2, SiO2: 1 },
  },
  {
    phaseId: 'forsterite',
    phase: 'Forsterite',
    formula: 'Mg2SiO4',
    compoundId: 'dimagnesium_silicate',
    oxides: { MgO: 2, SiO2: 1 },
  },
  {
    phaseId: 'spinel',
    phase: 'Spinel',
    formula: 'MgAl2O4',
    compoundId: 'alumina_magnesia',
    oxides: { MgO: 1, Al2O3: 1 },
  },
  {
    phaseId: 'akermanite',
    phase: 'Akermanite',
    formula: 'Ca2MgSi2O7',
    compoundId: 'akermanite',
    oxides: { CaO: 2, MgO: 1, SiO2: 2 },
  },
  {
    phaseId: 'diopside',
    phase: 'Diopside',
    formula: 'CaMgSi2O6',
    compoundId: 'CaO·MgO·2SiO2',
    oxides: { CaO: 1, MgO: 1, SiO2: 2 },
  },
  {
    phaseId: 'rutile',
    phase: 'Rutile',
    formula: 'TiO2',
    compoundId: 'titanium_dioxide',
    oxides: { TiO2: 1 },
  },
];
