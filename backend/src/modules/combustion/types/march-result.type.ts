import { GasFlows } from '../types';
import { GasStream } from './gas-stream.type';
import { LayerState } from './layer-state.type';

export type MarchResult = {
  layers: LayerState[];
  outlet: GasStream;
  fuel_kgs: number; carbon_mols: number; ash_kgs: number; ashEnthalpy_W: number;
  wallLoss_W: number; pressureDrop_Pa: number; steam: GasFlows;
}
