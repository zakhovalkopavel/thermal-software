/** One tabulated eutectic in {@link EUTECTIC_SYSTEMS}. */
export type EutecticSystemPoint = {
  name: string;
  /** Eutectic temperature [°C]. */
  temperature: number;
  /** Component wt%. */
  composition: Record<string, number>;
  system: string;
  references?: string[];
};
