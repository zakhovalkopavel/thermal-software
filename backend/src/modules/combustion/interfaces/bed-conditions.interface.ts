import { LayerDto } from '../../thermal-exchange/dto/layer.dto';
import { CondensedFuel } from './condensed-fuel.interface';

export interface BedConditions {
  fuel: CondensedFuel; porosity: number; particleSize_m: number; activityFactor: number;
  tFuel_K: number; tAmbient_K: number;
  wallLayers?: LayerDto[]; wallEmissivity: number;
}
