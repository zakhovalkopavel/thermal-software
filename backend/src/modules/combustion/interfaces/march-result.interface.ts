import { GasFlows } from '../types';
import { GasStream } from './gas-stream.interface';
import { LayerState } from './layer-state.interface';

export interface MarchResult {
  layers: LayerState[];
  outlet: GasStream;
  fuel_kgs: number; carbon_mols: number; ash_kgs: number; ashEnthalpy_W: number;
  wallLoss_W: number; pressureDrop_Pa: number; steam: GasFlows;
}
