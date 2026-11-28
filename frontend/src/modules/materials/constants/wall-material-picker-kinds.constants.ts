import type { MaterialPickerKind } from '../types/material-picker-kind.type';

/** Insulation / refractory families first, then metals (“all another”). */
export const WALL_MATERIAL_PICKER_KINDS: MaterialPickerKind[] = ['refractory', 'metal'];
