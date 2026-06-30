export type ThermalCriteria = {
  Bi: number;    // Biot number — α·R/λ  (Infinity for BC_I)
  Fo: number;    // Fourier number — ā·τ/R²
  Rdist: number; // profile scaling radius (m)
  Rbi: number;   // Biot-number characteristic radius (m)
};
