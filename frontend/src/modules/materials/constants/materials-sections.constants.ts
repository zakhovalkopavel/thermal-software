export const MATERIALS_SECTIONS = [
  {
    route: 'metals',
    label: 'Metals',
    description: 'Known metal grades → λ(T), ε(T)',
    step: 4,
  },
  {
    route: 'gases',
    label: 'Gases',
    description: 'Pure gases and mixtures → Cp, Cv, γ, μ, ν, ρ, λ, Pr',
    step: 5,
  },
  {
    route: 'refractories',
    label: 'Refractories',
    description: 'Known refractory and insulation products → λ(T), ε(T)',
    step: 6,
  },
  {
    route: 'raw-materials',
    label: 'Raw materials',
    description: 'Library materials by category → composition, reference properties, λ_eff(T), Cp(T)',
    step: 7,
  },
  {
    route: 'glasses',
    label: 'Glasses',
    description: 'Glass oxide composition (wt% / mol%) → viscosity, fixed points, T(η)',
    step: 8,
  },
  {
    route: 'mineral-compositions',
    label: 'Mineral compositions',
    description: 'Mix of raw materials in size fractions → chemistry, granulometry, packing, water, shrinkage',
    step: 9,
  },
] as const;
