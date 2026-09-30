import type { TemperatureSweep } from '../../../types/temperature-sweep.type';

export type GasMixtureFormProps = {
  species: string[];
  composition: Record<string, number>;
  onCompositionChange: (composition: Record<string, number>) => void;
  fractionType: 'mole' | 'mass';
  onFractionTypeChange: (fractionType: 'mole' | 'mass') => void;
  sweep: TemperatureSweep;
  onSweepChange: (sweep: TemperatureSweep) => void;
  pressure_atm: number | null;
  onPressureChange: (pressure: number | null) => void;
  onCalculate: () => void;
  loading: boolean;
  formError: string | null;
};
