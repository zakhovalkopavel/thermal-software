import type { TemperatureSweep } from '../../../types/temperature-sweep.type';

export type PureGasFormProps = {
  gases: Array<string | null>;
  onGasesChange: (gases: Array<string | null>) => void;
  sweep: TemperatureSweep;
  onSweepChange: (sweep: TemperatureSweep) => void;
  pressure_Pa: number | null;
  onPressureChange: (pressure: number | null) => void;
  onCalculate: () => void;
  loading: boolean;
  formError: string | null;
};
