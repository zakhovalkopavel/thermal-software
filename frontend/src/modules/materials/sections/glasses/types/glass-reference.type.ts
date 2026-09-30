export type GlassReference = {
  materialId: string;
  name: string;
  /** Library composition, wt%. */
  composition: Record<string, number>;
};
