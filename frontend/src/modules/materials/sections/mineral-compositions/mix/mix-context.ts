import { createContext } from 'react';
import type { MixContextValue } from '../types/mix-context-value.type';

export const MixContext = createContext<MixContextValue | null>(null);
