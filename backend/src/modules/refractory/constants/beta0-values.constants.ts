import { Beta0Model } from '../enums/beta0-model.enum';

/**
 * β₀ values by particle shape
 * Source: Johansen & Andersen (1991), de Larrard (1999) Table 2.1
 */
export const BETA0_VALUES: Record<Beta0Model, number> = {
  [Beta0Model.SPHERICAL]: 0.64,
  [Beta0Model.SUB_ANGULAR]: 0.60,
  [Beta0Model.ANGULAR]: 0.56,
  [Beta0Model.FLAKY]: 0.50,
};
