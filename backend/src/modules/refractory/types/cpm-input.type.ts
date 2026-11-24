import type { CPMCalibration } from './cpm-calibration.type';
import type { PackingInput } from './packing-input.type';

/** Complete CPM input with optional calibration and compaction. */
export type CPMInput = PackingInput & {
  /** Compaction pressure (MPa, optional) */
  compactionPressure_MPa?: number;

  /** CPM calibration parameters */
  calibration?: CPMCalibration;
};
