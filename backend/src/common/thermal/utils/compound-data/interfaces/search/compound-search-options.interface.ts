/** Options for in-memory compound catalogue search. */
export interface CompoundSearchOptions {
  limit?: number;
  /** When true, only compounds with gas-phase transport + thermo usable for fluid APIs. */
  gasesOnly?: boolean;
}
