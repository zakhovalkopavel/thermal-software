import { RefKey } from '../../enum/ref-key.enum';

/**
 * Preferred approximation selector.
 * Pass either a numeric index into the property's `values` array,
 * or a RefKey to select by literature source.
 * Omit (undefined) to use the property's `def` default.
 */
export type PreferredApprox = number | RefKey;
