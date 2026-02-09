import { ViscosityParameters } from '../interfaces/viscosity-parameters.interface';
import { ViscosityModel, ViscosityModelType } from '../enums/viscosity-model.enum';

/**
 * System-specific viscosity model parameters
 * Based on published literature for different glass systems
 */
export const VISCOSITY_PARAMETERS: Record<ViscosityModel, ViscosityParameters> = {
  [ViscosityModel.SODA_LIME_SILICA]: {
    modelType: ViscosityModelType.VFT,
    A: -3.2,
    B: 13250,
    T0: 320, // K (47°C)
    componentEffects: [
      { component: 'SiO2', effectMin: 40, effectMax: 50, validMin: 65, validMax: 80 },
      { component: 'Al2O3', effectMin: 100, effectMax: 120, validMin: 0, validMax: 5 },
      { component: 'Na2O', effectMin: -75, effectMax: -85, validMin: 10, validMax: 18 },
      { component: 'K2O', effectMin: -65, effectMax: -75, validMin: 0, validMax: 5 },
      { component: 'CaO', effectMin: -50, effectMax: -60, validMin: 5, validMax: 15 },
      { component: 'MgO', effectMin: 30, effectMax: 40, validMin: 0, validMax: 6 },
      { component: 'Fe2O3', effectMin: -35, effectMax: -45, validMin: 0, validMax: 2 },
    ],
    temperatureRange: { min: 500, max: 1400 },
    validCompositionRanges: {
      SiO2: { min: 65, max: 80 },
      'Na2O+K2O': { min: 10, max: 18 },
      'CaO+MgO': { min: 5, max: 15 },
    },
    reference: 'Lakatos et al. (1972), Glass Technology 13(3):88-95',
    notes: 'MgO acts as network former in soda-lime glasses. Most validated model for commercial glass.',
  },

  [ViscosityModel.BOROSILICATE]: {
    modelType: ViscosityModelType.VFT,
    A: -3.8,
    B: 16200,
    T0: 245, // K (-28°C)
    componentEffects: [
      { component: 'SiO2', effectMin: 45, effectMax: 55, validMin: 70, validMax: 85 },
      { component: 'B2O3', effectMin: -30, effectMax: -20, validMin: 8, validMax: 15 },
      { component: 'Al2O3', effectMin: 90, effectMax: 110, validMin: 0, validMax: 5 },
      { component: 'Na2O', effectMin: -80, effectMax: -90, validMin: 2, validMax: 8 },
      { component: 'K2O', effectMin: -70, effectMax: -80, validMin: 0, validMax: 3 },
    ],
    temperatureRange: { min: 400, max: 1400 },
    validCompositionRanges: {
      SiO2: { min: 70, max: 85 },
      B2O3: { min: 8, max: 15 },
      'Na2O+K2O': { min: 2, max: 10 },
    },
    reference: 'Dingwell et al. (1992), Chemical Geology 95(3-4):229-237',
    notes: 'Boron anomaly occurs at 15-20 mol% B2O3. Model less accurate in anomaly region.',
  },

  [ViscosityModel.ALUMINOSILICATE]: {
    modelType: ViscosityModelType.VFT,
    A: -4.5,
    B: 19000,
    T0: 350, // K (77°C)
    componentEffects: [
      { component: 'SiO2', effectMin: 50, effectMax: 65, validMin: 50, validMax: 70 },
      { component: 'Al2O3', effectMin: 65, effectMax: 85, validMin: 15, validMax: 30 },
      { component: 'CaO', effectMin: -55, effectMax: -70, validMin: 5, validMax: 15 },
      { component: 'MgO', effectMin: -45, effectMax: -60, validMin: 0, validMax: 10 },
      { component: 'Na2O', effectMin: -85, effectMax: -100, validMin: 0, validMax: 5 },
      { component: 'K2O', effectMin: -75, effectMax: -90, validMin: 0, validMax: 3 },
      { component: 'FeO', effectMin: -50, effectMax: -65, validMin: 0, validMax: 15 },
      { component: 'Fe2O3', effectMin: -45, effectMax: -60, validMin: 0, validMax: 10 },
    ],
    temperatureRange: { min: 900, max: 1600 },
    validCompositionRanges: {
      SiO2: { min: 50, max: 70 },
      Al2O3: { min: 15, max: 30 },
    },
    reference: 'Giordano et al. (2008), EPSL 271:123-134',
    notes: 'Al coordination depends on alkali/Al2O3 ratio. MgO acts as modifier (unlike in SLS).',
  },

  [ViscosityModel.LEAD_GLASS]: {
    modelType: ViscosityModelType.ARRHENIUS,
    A: -7.2,
    B: 11800,
    T0: undefined,
    componentEffects: [
      { component: 'SiO2', effectMin: 42, effectMax: 52, validMin: 50, validMax: 70 },
      { component: 'PbO', effectMin: -75, effectMax: -95, validMin: 20, validMax: 40 },
      { component: 'K2O', effectMin: -80, effectMax: -95, validMin: 5, validMax: 15 },
      { component: 'Na2O', effectMin: -85, effectMax: -100, validMin: 0, validMax: 10 },
      { component: 'Al2O3', effectMin: 95, effectMax: 115, validMin: 0, validMax: 5 },
    ],
    temperatureRange: { min: 400, max: 1100 },
    validCompositionRanges: {
      SiO2: { min: 50, max: 70 },
      PbO: { min: 20, max: 40 },
    },
    reference: 'Mazurin & Gankin (1983), Handbook of Glass Data',
    notes: 'PbO very strong flux. Arrhenius fits better than VFT for lead glasses.',
  },

  [ViscosityModel.PURE_SILICA]: {
    modelType: ViscosityModelType.VFT,
    A: -2.8,
    B: 13500,
    T0: 475, // K (202°C)
    componentEffects: [
      { component: 'SiO2', effectMin: 55, effectMax: 65, validMin: 99, validMax: 100 },
    ],
    temperatureRange: { min: 1100, max: 2300 },
    validCompositionRanges: {
      SiO2: { min: 99, max: 100 },
    },
    reference: 'Urbain et al. (1982), Hetherington et al. (1964)',
    notes: 'Very high T0. Reference standard for pure network former behavior.',
  },

  [ViscosityModel.SODIUM_SILICATE]: {
    modelType: ViscosityModelType.VFT,
    A: -3.5,
    B: 7000,
    T0: 225, // K (-48°C)
    componentEffects: [
      { component: 'SiO2', effectMin: 35, effectMax: 45, validMin: 60, validMax: 75 },
      { component: 'Na2O', effectMin: -90, effectMax: -110, validMin: 18, validMax: 35 },
    ],
    temperatureRange: { min: 700, max: 1300 },
    validCompositionRanges: {
      SiO2: { min: 60, max: 75 },
      Na2O: { min: 18, max: 35 },
    },
    reference: 'Bockris et al. (1955)',
    notes: 'Binary system. High alkali content leads to low viscosity.',
  },

  [ViscosityModel.SLAG_CAO_AL2O3]: {
    modelType: ViscosityModelType.ARRHENIUS,
    A: -0.5,
    B: 3500,
    T0: undefined,
    componentEffects: [
      { component: 'CaO', effectMin: -15, effectMax: -25, validMin: 30, validMax: 50 },
      { component: 'Al2O3', effectMin: 20, effectMax: 30, validMin: 20, validMax: 40 },
      { component: 'SiO2', effectMin: 25, effectMax: 35, validMin: 20, validMax: 45 },
      { component: 'MgO', effectMin: -10, effectMax: -20, validMin: 0, validMax: 15 },
      { component: 'FeO', effectMin: -20, effectMax: -30, validMin: 0, validMax: 25 },
      { component: 'Fe2O3', effectMin: -15, effectMax: -25, validMin: 0, validMax: 20 },
    ],
    temperatureRange: { min: 1300, max: 1600 },
    validCompositionRanges: {
      CaO: { min: 30, max: 50 },
      Al2O3: { min: 20, max: 40 },
      SiO2: { min: 20, max: 45 },
    },
    reference: 'Mills et al. (1993), Slag Atlas',
    notes: 'Metallurgical slag. High temperature applications.',
  },

  [ViscosityModel.FLUORIDE_GLASS]: {
    modelType: ViscosityModelType.VFT,
    A: -4.0,
    B: 8000,
    T0: 150, // K (-123°C)
    componentEffects: [],
    temperatureRange: { min: 200, max: 600 },
    validCompositionRanges: {
      'Fluorides': { min: 20, max: 100 },
    },
    reference: 'Poulain et al. (1977)',
    notes: 'Specialty optical applications. Limited data available.',
  },

  [ViscosityModel.MULTI_COMPONENT_MIXING]: {
    modelType: ViscosityModelType.VFT,
    A: -3.5,
    B: 14000,
    T0: 300,
    componentEffects: [], // Uses generic effects from component-properties.ts
    temperatureRange: { min: 300, max: 1600 },
    validCompositionRanges: {},
    reference: 'Generic mixing model',
    notes: 'Low accuracy. Experimental validation recommended.',
  },
};

