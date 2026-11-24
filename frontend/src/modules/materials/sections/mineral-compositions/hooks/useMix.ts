import { useContext } from 'react';
import { MixContext } from '../mix/mix-context';
import type { MixContextValue } from '../types/mix-context-value.type';

export function useMix(): MixContextValue {
  const value = useContext(MixContext);
  if (!value) throw new Error('useMix must be used inside MixProvider');
  return value;
}
