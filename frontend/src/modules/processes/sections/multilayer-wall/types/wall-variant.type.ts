export type WallVariant = {
  id: string;
  label: string;
  /** Distance from the inner surface [mm], T [°C]. */
  points: [number, number][];
};
