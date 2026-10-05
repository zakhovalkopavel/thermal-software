/**
 * Constants of `POST /refractory/mix/thermal` (fired library raw materials and their mixes).
 * Algorithm: docs/algorithms/MIX_THERMAL_ALGORITHM.md
 */
export const MIX_THERMAL_CONSTANTS = {
  /**
   * Fired phase key → condensed NASA-9 species (`data/nasa/nasa9.json`) in ascending temperature order.
   * Consecutive species are polymorphs (α-quartz → β-quartz → β-cristobalite, monoclinic → tetragonal ZrO₂).
   * Phases missing here use the material's library Cp for their share.
   */
  phaseNasa9Species: {
    SiO2:   ['SiO2(a-qz)', 'SiO2(b-qz)', 'SiO2(b-crt)'],
    Al2O3:  ['AL2O3(a)'],
    CaO:    ['CaO(cr)'],
    MgO:    ['MgO(cr)'],
    Fe2O3:  ['Fe2O3(s)'],
    FeO:    ['FeO(s)'],
    K2O:    ['K2O(s)'],
    Na2O:   ['Na2O(c)', 'Na2O(a)'],
    TiO2:   ['TiO2(ru)'],
    ZrO2:   ['ZrO2(a)', 'ZrO2(b)'],
    Cr2O3:  ['Cr2O3(s)'],
    B2O3:   ['B2O3(cr)'],
    SiC:    ['SiC(b)', 'SiC(b)#2'],
    TiC:    ['TiC(s)'],
    B4C:    ['B4C(cr)', 'B4C(cr)#2'],
    C:      ['C(gr)'],
    AlN:    ['ALN(cr)'],
    BN:     ['BN(cr)'],
    TiN:    ['TiN(s)'],
    Si3N4:  ['Si3N4(cr)'],
    Si2N2O: ['Si2N2O(s)'],
  } as Readonly<Record<string, ReadonlyArray<string>>>,

  /** Phases whose conductivity is electronic (λ roughly constant with T) */
  electronicConductorPhases: ['TiN', 'TiC', 'Cr3C2'] as ReadonlyArray<string>,

  /** Temperature of the library reference λ and Cp [K] */
  referenceTemperature_K: 298.15,

  /**
   * Amorphous-limit solid conductivity [W/(m·K)] (vitreous silica at room temperature).
   * Phonon law: λ(T) = λ_am + (λ_ref − λ_am) · T_ref / T.
   */
  lambdaAmorphous_WmK: 1.3,

  /** Share of fired mass [wt%] without NASA-9 Cp above which a warning is returned */
  heatCapacityCoverageWarning_wt: 5,

  /** Upper bound of the porosity accepted by the Maxwell–Eucken (solid-continuous) model */
  porosityMax: 0.95,

  /**
   * Lowest accepted temperature [K]: start of the NASA-9 solid data of SiO2, Al2O3, CaO, MgO.
   * Below it Cp is clamped and the phonon law (∝ 1/T) diverges towards 0 K.
   */
  minTemperature_K: 200,

  maxTemperatures: 301,
} as const;
