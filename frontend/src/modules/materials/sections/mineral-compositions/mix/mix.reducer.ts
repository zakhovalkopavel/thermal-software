import { MINERAL_COMPOSITIONS_UI } from '../constants/mineral-compositions-ui.constants';
import { toNewMixFraction } from '../mappers/new-mix-fraction.mapper';
import type { MixAction } from '../types/mix-action.type';
import type { MixFraction } from '../types/mix-fraction.type';
import type { MixState } from '../types/mix-state.type';

const round = (value: number) => Number(value.toFixed(MINERAL_COMPOSITIONS_UI.massDecimals));

const SIZE_FIELDS = ['sizeKey', 'dMin_mm', 'dMax_mm', 'd50_mm'] as const;

const withoutSizeFields = (patch: Partial<Omit<MixFraction, 'id'>>): Partial<Omit<MixFraction, 'id'>> => {
  const next = { ...patch };
  for (const field of SIZE_FIELDS) delete next[field];
  return next;
};

const applyUpdate = (fraction: MixFraction, patch: Partial<Omit<MixFraction, 'id'>>): MixFraction => {
  const materialChanging = patch.materialId !== undefined && patch.materialId !== fraction.materialId;
  const isBinderRow = fraction.sizeKey === MINERAL_COMPOSITIONS_UI.materialSizeKey;
  const allowed = isBinderRow && !materialChanging ? withoutSizeFields(patch) : patch;
  return { ...fraction, ...allowed };
};

export function mixReducer(state: MixState, action: MixAction): MixState {
  switch (action.type) {
    case 'add':
      return { ...state, fractions: [...state.fractions, toNewMixFraction()] };
    case 'update':
      return {
        ...state,
        fractions: state.fractions.map((fraction) => (fraction.id === action.id ? applyUpdate(fraction, action.patch) : fraction)),
      };
    case 'remove':
      return { ...state, fractions: state.fractions.filter((fraction) => fraction.id !== action.id) };
    case 'normalize': {
      const sum = state.fractions.reduce((total, fraction) => total + (fraction.massPercent ?? 0), 0);
      if (sum <= 0) return state;
      return {
        ...state,
        fractions: state.fractions.map((fraction) => ({
          ...fraction,
          massPercent:
            fraction.massPercent === null ? null : round((fraction.massPercent * MINERAL_COMPOSITIONS_UI.massPercentTotal) / sum),
        })),
      };
    }
    case 'setPacking':
      return { ...state, phi: action.phi, porosity: action.porosity, packingModel: action.packingModel };
    case 'applyMassPercents':
      return {
        ...state,
        fractions: state.fractions.map((fraction) =>
          !fraction.isFixed && action.massPercents[fraction.id] !== undefined
            ? { ...fraction, massPercent: round(action.massPercents[fraction.id]) }
            : fraction,
        ),
      };
  }
}
