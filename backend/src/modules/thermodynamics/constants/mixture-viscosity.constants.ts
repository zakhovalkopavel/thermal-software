/**
 * Mixture gas viscosity: Wilke dilute + Chung Δη below Y_SWITCH;
 * full Chung 1988 when y ≥ Y_SWITCH (y = Vc/(6V)).
 * Same y threshold as mixture thermal conductivity.
 */
export const MIXTURE_VISCOSITY = {
  /**
   * Wilke + Chung Δη when y < this value; full Chung dense μ when y ≥ this value.
   */
  Y_SWITCH: 0.01,
} as const;
