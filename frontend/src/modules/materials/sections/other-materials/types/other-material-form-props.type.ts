import type { CompoundSelection } from '../../../types/compound-selection.type';
import type { TemperatureSweep } from '../../../types/temperature-sweep.type';

export type OtherMaterialFormProps = {
  selection: CompoundSelection | null;
  onSelectionChange: (selection: CompoundSelection | null) => void;
  sweep: TemperatureSweep;
  onSweepChange: (sweep: TemperatureSweep) => void;
  pressure_Pa: number | null;
  onPressureChange: (pressure_Pa: number | null) => void;
  gasCapable: boolean;
  /** True once gas-bounds has settled for the current compound. */
  gasChecked: boolean;
  boundsHint: string | null;
  onCalculate: () => void;
  loading: boolean;
  formError: string | null;
};
