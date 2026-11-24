import { useMemo, useReducer } from 'react';
import type { ReactNode } from 'react';
import { useMixComponents } from '../../../hooks/useMixComponents';
import { MINERAL_COMPOSITIONS_UI } from '../constants/mineral-compositions-ui.constants';
import { isFractionComplete } from '../mappers/is-fraction-complete.mapper';
import { toNewMixFraction } from '../mappers/new-mix-fraction.mapper';
import type { MixContextValue } from '../types/mix-context-value.type';
import type { MixState } from '../types/mix-state.type';
import { MixContext } from './mix-context';
import { mixReducer } from './mix.reducer';

const createInitialState = (): MixState => ({ fractions: [toNewMixFraction()], phi: null, porosity: null });

export function MixProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(mixReducer, undefined, createInitialState);
  const mixComponents = useMixComponents();

  const value = useMemo<MixContextValue>(() => {
    const components = new Map(
      (mixComponents.data ?? []).flatMap((category) => category.materials.map((entry) => [entry.materialId, entry] as const)),
    );
    const completeFractions = state.fractions.filter(isFractionComplete);
    const massPercentSum = state.fractions.reduce((total, fraction) => total + (fraction.massPercent ?? 0), 0);
    const ready =
      state.fractions.length > 0 &&
      completeFractions.length === state.fractions.length &&
      Math.abs(massPercentSum - MINERAL_COMPOSITIONS_UI.massPercentTotal) <= MINERAL_COMPOSITIONS_UI.massPercentTolerance;
    return { state, dispatch, components, completeFractions, ready, massPercentSum };
  }, [state, mixComponents.data]);

  return <MixContext.Provider value={value}>{children}</MixContext.Provider>;
}
