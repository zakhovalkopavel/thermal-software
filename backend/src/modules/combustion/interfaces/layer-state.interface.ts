import { BedLayerResultDto } from '../dto/bed';
import { GasFlows } from '../types';

export interface LayerState {
  flows: GasFlows; T_K: number; result: BedLayerResultDto;
  fuel_kgs: number; carbon_mols: number; ash_kgs: number; ashEnthalpy_W: number; wallLoss_W: number;
  steam: GasFlows;
}
