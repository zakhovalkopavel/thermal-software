import type { MetalSummary } from '../../../types/metal-summary.type';
import type { TemperatureSweep } from '../../../types/temperature-sweep.type';

export type MetalConditionsFormProps = {
  metals: MetalSummary[];
  grades: Array<string | null>;
  onGradesChange: (grades: Array<string | null>) => void;
  sweep: TemperatureSweep;
  onSweepChange: (sweep: TemperatureSweep) => void;
  onCalculate: () => void;
  loading: boolean;
  formError: string | null;
};
