import { CompoundValue } from '../../types/compound-value.type';
import { Nasa9Species } from './types/nasa9-species.type';
import { nasa9Species } from './nasa9-species.util';

/** NASA-9 record of a compound, or undefined when it has no `nasa9Key` */
export function compoundNasa9(compound: CompoundValue): Nasa9Species | undefined {
  return compound.nasa9Key ? nasa9Species(compound.nasa9Key) : undefined;
}
