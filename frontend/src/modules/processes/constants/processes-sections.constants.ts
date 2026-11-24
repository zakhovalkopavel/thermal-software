export const PROCESSES_SECTIONS = [
  {
    route: 'combustion',
    label: 'Combustion',
    description: 'Fuel combustion → flame temperature, mass flows, flue-gas composition',
    step: 10,
  },
  {
    route: 'multilayer-wall',
    label: 'Multilayer wall',
    description: 'Furnace wall of metal and refractory layers → temperatures and heat flux',
    step: 10,
  },
  {
    route: 'htc',
    label: 'HTC',
    description: 'Heat-transfer coefficient and dimensionless numbers (Re, Pr, Gr, Ra, Nu)',
    step: 11,
  },
  {
    route: 'recuperator',
    label: 'Recuperator',
    description: 'Flue-gas / air recuperator sizing and energy balance',
    step: 11,
  },
  {
    route: 'thermal-distribution',
    label: 'Thermal distribution',
    description: 'Transient conduction in a body → criteria, T(ξ, τ), average T',
    step: 11,
  },
] as const;
