/** Synthetic unreacted-phase model used when a library material has no `mineralogy`. */
export const UNREACTED_PHASE_CONSTANTS = {
  /** An oxide with at least this share of the fired material is its primary crystal phase [wt%] */
  dominantOxideMinShare_wt: 50,

  /** Amounts below this share of the fired body are dropped [%] */
  minPercent: 1e-6,

  /** Primary crystal phase of a pure oxide (identifier and display name) */
  primaryPhases: {
    Al2O3: { phaseId: 'corundum', phase: 'Corundum' },
    SiO2: { phaseId: 'quartz', phase: 'Quartz' },
    CaO: { phaseId: 'lime', phase: 'Lime' },
    MgO: { phaseId: 'periclase', phase: 'Periclase' },
    TiO2: { phaseId: 'rutile', phase: 'Rutile' },
    ZrO2: { phaseId: 'baddeleyite', phase: 'Baddeleyite' },
    Cr2O3: { phaseId: 'eskolaite', phase: 'Eskolaite' },
    Fe2O3: { phaseId: 'hematite', phase: 'Hematite' },
  } as Readonly<Record<string, { phaseId: string; phase: string }>>,

  /** Phase id of the glassy remainder of a material */
  glassPhaseId: 'glass',
} as const;
