export type MixFraction = {
  /** Client-side id. */
  id: string;
  /** Mix component from GET /refractory/mix-components. */
  materialId: string | null;
  /** `<group>:<code>` from GET /refractory/particle-sizes, or the custom option. */
  sizeKey: string | null;
  dMin_mm: number | null;
  dMax_mm: number | null;
  d50_mm: number | null;
  /** 0–100 */
  massPercent: number | null;
  /** Defaults to the library true density after firing. */
  density_kgm3: number | null;
  /** Kept constant by the PSD models and the optimiser. */
  isFixed: boolean;
};
