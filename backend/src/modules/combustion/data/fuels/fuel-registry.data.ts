import { FuelDefinition } from '../../types';
import { FuelId } from '../../enums/fuel-id.enum';
import { CHARCOAL_BRIQUETTE } from './charcoal-briquette.data';
import { CHARCOAL_OAK } from './charcoal-oak.data';
import { MAP_PRO } from './map-pro.data';

export const FUEL_REGISTRY: Record<FuelId, FuelDefinition> = {
  [FuelId.CharcoalBriquette]: CHARCOAL_BRIQUETTE,
  [FuelId.CharcoalOak]:       CHARCOAL_OAK,
  [FuelId.MapPro]:            MAP_PRO,
};
