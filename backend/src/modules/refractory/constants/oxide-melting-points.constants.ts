/**
 * Melting points of pure oxides [°C] (Kingery et al. 1976; Levin et al. 1964; same values as
 * the legacy COMPONENT_PROPERTIES). Na2O and K2O sublime / decompose near these values.
 */
export const OXIDE_MELTING_POINTS_C: Readonly<Record<string, number>> = {
  SiO2: 1710,
  Al2O3: 2072,
  CaO: 2613,
  MgO: 2852,
  Na2O: 1275,
  K2O: 740,
  Fe2O3: 1565,
  TiO2: 1843,
  ZrO2: 2715,
  Cr2O3: 2330,
  B2O3: 450,
};
