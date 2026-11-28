/** Options for in-memory compound catalogue search. */
export type CompoundSearchOptions = {
  limit?: number;
  /** When true, only compounds with gas-phase transport + thermo usable for fluid APIs. */
  gasesOnly?: boolean;
  /** When true, only compounds with liquid μ, λ, ρ and Cp usable for liquid fluid / HTC APIs. */
  liquidsOnly?: boolean;
}
