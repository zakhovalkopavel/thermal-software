import type { PropertyTerm } from '../types/property-term.type';

/** Shared glossary for short-intro property tokens (Phase 1 stubs). */
export const PROPERTY_TERMS = {
  cp: {
    id: 'cp',
    symbol: 'Cp',
    tooltip: 'Heat capacity at constant pressure',
    anchorId: 'prop-cp',
  },
  cv: {
    id: 'cv',
    symbol: 'Cv',
    tooltip: 'Heat capacity at constant volume',
    anchorId: 'prop-cv',
  },
  gamma: {
    id: 'gamma',
    symbol: 'γ',
    tooltip: 'Heat-capacity ratio Cp/Cv',
    anchorId: 'prop-gamma',
  },
  molarMass: {
    id: 'molarMass',
    symbol: 'M',
    tooltip: 'Molar mass',
    anchorId: 'prop-m',
  },
  viscosity: {
    id: 'viscosity',
    symbol: 'μ',
    tooltip: 'Dynamic viscosity',
    anchorId: 'prop-mu',
  },
  kinematicViscosity: {
    id: 'kinematicViscosity',
    symbol: 'ν',
    tooltip: 'Kinematic viscosity',
    anchorId: 'prop-nu',
  },
  density: {
    id: 'density',
    symbol: 'ρ',
    tooltip: 'Density',
    anchorId: 'prop-rho',
  },
  electricalResistivity: {
    id: 'electricalResistivity',
    symbol: 'ρₑ',
    tooltip: 'Electrical resistivity',
    anchorId: 'prop-rho-e',
  },
  thermalConductivity: {
    id: 'thermalConductivity',
    symbol: 'λ',
    tooltip: 'Thermal conductivity',
    anchorId: 'prop-lambda',
  },
  prandtl: {
    id: 'prandtl',
    symbol: 'Pr',
    tooltip: 'Prandtl number',
    anchorId: 'prop-pr',
  },
  enthalpy: {
    id: 'enthalpy',
    symbol: 'H',
    tooltip: 'Enthalpy',
    anchorId: 'prop-h',
  },
  emissivity: {
    id: 'emissivity',
    symbol: 'ε',
    tooltip: 'Emissivity',
    anchorId: 'prop-epsilon',
  },
  thermalExpansion: {
    id: 'thermalExpansion',
    symbol: 'α',
    tooltip: 'Linear thermal expansion coefficient (or HTC in process context)',
    anchorId: 'prop-alpha',
  },
  thermalDiffusivity: {
    id: 'thermalDiffusivity',
    symbol: 'a',
    tooltip: 'Thermal diffusivity',
    anchorId: 'prop-a',
  },
  viscosityEta: {
    id: 'viscosityEta',
    symbol: 'η',
    tooltip: 'Dynamic viscosity (η form)',
    anchorId: 'prop-eta',
  },
  reynolds: {
    id: 'reynolds',
    symbol: 'Re',
    tooltip: 'Reynolds number',
    anchorId: 'prop-re',
  },
  nusselt: {
    id: 'nusselt',
    symbol: 'Nu',
    tooltip: 'Nusselt number',
    anchorId: 'prop-nu-number',
  },
  grashof: {
    id: 'grashof',
    symbol: 'Gr',
    tooltip: 'Grashof number',
    anchorId: 'prop-gr',
  },
  rayleigh: {
    id: 'rayleigh',
    symbol: 'Ra',
    tooltip: 'Rayleigh number',
    anchorId: 'prop-ra',
  },
  biot: {
    id: 'biot',
    symbol: 'Bi',
    tooltip: 'Biot number',
    anchorId: 'prop-bi',
  },
  fourier: {
    id: 'fourier',
    symbol: 'Fo',
    tooltip: 'Fourier number',
    anchorId: 'prop-fo',
  },
  lambdaEff: {
    id: 'lambdaEff',
    symbol: 'λ_eff',
    tooltip: 'Effective thermal conductivity',
    anchorId: 'prop-lambda-eff',
  },
} as const satisfies Record<string, PropertyTerm>;

export type PropertyTermId = keyof typeof PROPERTY_TERMS;

/** Longest symbols first so ρₑ / λ_eff match before ρ / λ. */
export const PROPERTY_TERMS_BY_SYMBOL_LENGTH: readonly PropertyTerm[] = Object.values(PROPERTY_TERMS).sort(
  (a, b) => b.symbol.length - a.symbol.length,
);
