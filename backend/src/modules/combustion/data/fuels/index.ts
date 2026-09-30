import { FuelDefinition } from './fuel.interface';
import { FuelId } from '../../enums/fuel-id.enum';
import { CHARCOAL_BRIQUETTE } from './charcoal-briquette.data';
import { CHARCOAL_OAK } from './charcoal-oak.data';
import { MAP_PRO } from './map-pro.data';

export * from './fuel.interface';
export { CHARCOAL_BRIQUETTE } from './charcoal-briquette.data';
export { CHARCOAL_OAK } from './charcoal-oak.data';
export { MAP_PRO } from './map-pro.data';

export const FUEL_REGISTRY: Record<FuelId, FuelDefinition> = {
  [FuelId.CharcoalBriquette]: CHARCOAL_BRIQUETTE,
  [FuelId.CharcoalOak]:       CHARCOAL_OAK,
  [FuelId.MapPro]:            MAP_PRO,
};
