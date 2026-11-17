import type { CompoundSelection } from '../../../types/compound-selection.type';
import type { TemperatureSweep } from '../../../types/temperature-sweep.type';

export type PureGasFormProps = {
  gases: Array<CompoundSelection | null>;
  onGasesChange: (gases: Array<CompoundSelection | null>) => void;
  sweep: TemperatureSweep;
  onSweepChange: (sweep: TemperatureSweep) => void;
  pressure_Pa: number | null;
  onPressureChange: (pressure: number | null) => void;
  boundsHint?: string | null;
  onCalculate: () => void;
  loading: boolean;
  formError: string | null;
};
