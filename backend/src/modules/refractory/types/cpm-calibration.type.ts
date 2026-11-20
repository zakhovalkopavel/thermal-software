/** CPM (Compressible Packing Model) calibration parameters. */
export type CPMCalibration = {
  /** Virtual packing limit (0-1, default 0.64) */
  beta0?: number;

  /** Compaction constant (default 9.0) */
  K?: number;
};
