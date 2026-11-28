import type { CompoundSelection } from '../../../types/compound-selection.type';
import type { FluidPhase } from '../../../types/fluid-phase.type';
import type { TemperatureSweep } from '../../../types/temperature-sweep.type';

export type OtherMaterialFormProps = {
  selection: CompoundSelection | null;
  onSelectionChange: (selection: CompoundSelection | null) => void;
  sweep: TemperatureSweep;
  onSweepChange: (sweep: TemperatureSweep) => void;
  pressure_Pa: number | null;
  onPressureChange: (pressure_Pa: number | null) => void;
  phase: FluidPhase;
  onPhaseChange: (phase: FluidPhase) => void;
  gasCapable: boolean;
  liquidCapable: boolean;
  /** True once gas- and liquid-bounds have settled for the current compound. */
  boundsChecked: boolean;
  boundsHint: string | null;
  onCalculate: () => void;
  loading: boolean;
  formError: string | null;
};
