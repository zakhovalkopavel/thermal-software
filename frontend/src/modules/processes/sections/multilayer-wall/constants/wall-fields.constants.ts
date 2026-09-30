import type { NumberFieldSpec } from '../../../types/number-field-spec.type';
import type { WallFieldKey } from '../types/wall-field-key.type';

/** Limits follow `MultilayerWallInputDto`. */
export const WALL_FIELDS = {
  geometry: [
    { key: 'a_m', label: 'Inner dimension a', unit: 'm', min: 0.001, required: true, helperText: 'Cylinder: inner radius; flat: half-width' },
    { key: 'b_m', label: 'Second dimension b', unit: 'm', min: 0, helperText: 'Cylinder: length; flat: width' },
  ],
  gas: [
    { key: 'tFlame_K', label: 'Flame / gas T', unit: 'K', min: 300, required: true },
    { key: 'mPerSecond_kgs', label: 'Gas mass flow', unit: 'kg/s', min: 0, required: true },
    { key: 'w_ms', label: 'Gas velocity', unit: 'm/s', min: 0, required: true },
    { key: 'innerEmissivity', label: 'Inner emissivity', min: 0, max: 1, required: true },
    { key: 'tAmbient_K', label: 'Ambient T', unit: 'K', min: 200, required: true },
  ],
  advanced: [{ key: 'numberOfSteps', label: 'FD steps through the wall', min: 5, helperText: 'Default 50' }],
} satisfies Record<string, NumberFieldSpec<WallFieldKey>[]>;
