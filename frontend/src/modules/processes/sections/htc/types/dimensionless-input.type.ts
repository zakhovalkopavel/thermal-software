export type DimensionlessInput = {
  geometry: string;
  fluid?: string;
  composition?: Record<string, number>;
  T_fluid_K?: number;
  T_surface_K?: number;
  P_Pa?: number;
  w_m_s?: number;
  dimensions?: Record<string, number>;
  g_m_s2?: number;
  forceRegime?: string;
  preferredCorrelation?: string;
  compareAll?: boolean;
  isHeating?: boolean;
};
