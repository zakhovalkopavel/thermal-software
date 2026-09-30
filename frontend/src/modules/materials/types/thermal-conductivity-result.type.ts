export type ThermalConductivityResult = {
  thermalConductivity_WmK: number;
  specificHeat_JkgK: number;
  density_kgm3: number;
  thermalDiffusivity_m2s: number;
  temperature_C: number;
  porosity: number;
  components: Record<string, unknown>;
};
