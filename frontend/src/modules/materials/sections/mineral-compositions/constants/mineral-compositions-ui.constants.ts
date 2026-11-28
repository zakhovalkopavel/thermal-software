export const MINERAL_COMPOSITIONS_UI = {
  customSizeKey: 'custom',
  /** Binders use the library `particleSize` rather than a catalogue class. */
  materialSizeKey: 'material',
  binderGroup: 'binder',
  massPercentTotal: 100,
  massPercentTolerance: 0.5,
  /** `FractionInputDto.density_kgm3` limits (blend optimiser). */
  densityMin_kgm3: 1000,
  densityMax_kgm3: 4000,
  massDecimals: 2,
  messages: {
    sizeFractionRequired: 'Selecting a size fraction is required for every component.',
    binderAsDelivered: 'As delivered',
    binderMissingParticleSize: 'This binder has no library particle size',
  },
  psd: {
    defaultQ: 0.37,
    qMin: 0.2,
    qMax: 0.5,
    qStep: 0.01,
    debounce_ms: 300,
    andreasenDmin_mm: 0,
    /** Shown next to the q slider / chip group */
    qHelp:
      'Distribution modulus q sets how fine vs coarse the ideal PSD is (Andreasen / Funk–Dinger). Lower q → more fines (self-flowing); higher q → coarser (needs vibration). Typical: 0.21–0.25 self-compacting, 0.27–0.30 flowable/vibratable, 0.33–0.37 hand-pressed / Fuller.',
  },
  chemistry: {
    defaultTemperature_C: 1400,
    temperatureMin_C: 500,
    temperatureMax_C: 2000,
    defaultTotalMass: 100,
    defaultHoldTime_hours: 2,
    holdTimeMin_hours: 0,
    defaultPorosity: 0.2,
    /** Upper bound of `POST /mix/thermal` Maxwell–Eucken porosity. */
    porosityMax: 0.95,
    densePorosity: 0,
    sweep: { from: 1000, to: 1600, step: 50 },
    sweepMaxPoints: 25,
  },
  packing: { compactionPressureMin_MPa: 0, efficiencyFactorMin: 0, efficiencyFactorMax: 1 },
  water: { defaultWorkability: 'standard', phiMin: 0, phiMax: 1 },
  shrinkage: {
    defaultProfile_C: '110, 600, 800, 1000, 1200, 1400',
    defaultWaterCementRatio: 0.5,
    defaultCementContent: 0.1,
    defaultCementType: 'CAC',
    fractionMin: 0,
    fractionMax: 1,
    holdTimeMin_hours: 0,
  },
  blend: {
    qChoices: [0.21, 0.25, 0.27, 0.3, 0.33, 0.37],
    defaultQValues: [0.25, 0.3, 0.37],
    defaultMethods: ['Andreasen', 'FunkDinger'],
    defaultPackingModels: ['CPM'],
    defaultScenarios: ['Vibratable'],
    tableMaxHeight: 480,
    defaultWaterCementRatio: 0.35,
    qColumnLabel: 'q (modulus)',
  },
  structureChartHeight: 320,
} as const;
