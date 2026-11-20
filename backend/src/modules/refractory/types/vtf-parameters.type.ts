/**
 * Fitted VTF (Vogel-Tammann-Fulcher) parameters.
 * Equation: log₁₀(η [Pa·s]) = A + B / (T [°C] − T₀)
 * Inversion: T = B / (log η − A) + T₀
 */
export type VtfParameters = {
  /** High-temperature limiting log₁₀ viscosity (dimensionless) */
  A: number;
  /** Pseudo-activation-energy parameter (K, must be > 0) */
  B: number;
  /** Vogel temperature (°C, must be > 0 and < lowest isokom T) */
  T0: number;
};
