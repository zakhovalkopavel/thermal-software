import { CompoundValue } from '../../types/compound-value.type';
import { Nasa7Species } from './types/nasa7-species.type';
import { nasa7Species } from './nasa7-species.util';

/** NASA-7 record of a compound, or undefined when it has no `nasa7Key` */
export function compoundNasa7(compound: CompoundValue): Nasa7Species | undefined {
  return compound.nasa7Key ? nasa7Species(compound.nasa7Key) : undefined;
}
