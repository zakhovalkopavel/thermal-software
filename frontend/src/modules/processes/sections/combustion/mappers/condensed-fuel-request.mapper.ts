import { assertRequiredNumbers } from '../../../mappers/required-numbers.mapper';
import { withoutNulls } from '../../../mappers/without-nulls.mapper';
import type { CondensedFuel } from '../../../types/condensed-fuel.type';
import type { ElementalComposition } from '../../../types/elemental-composition.type';
import { COMBUSTION_FIELDS } from '../constants/combustion-fields.constants';
import type { CondensedFuelDraft } from '../types/condensed-fuel-draft.type';

/** Custom fuel; `withBed` adds the packed-bed properties the bed model needs. */
export function toCondensedFuel(draft: CondensedFuelDraft, withBed: boolean): CondensedFuel {
  assertRequiredNumbers(COMBUSTION_FIELDS.elemental, draft.elemental);
  if (withBed) assertRequiredNumbers(COMBUSTION_FIELDS.customFuelBed, draft.properties);
  const { energy_J_kg, specificHeat_J_kgK, porosity, bulkDensity_kg_m3, particleSize_m, activityFactor, emissivity } = draft.properties;
  if (energy_J_kg === null) throw new Error('Enter the lower heating value or the formation enthalpy of the fuel.');
  const name = draft.name.trim();
  return {
    ...(name ? { name } : {}),
    elementalComp: withoutNulls(draft.elemental) as ElementalComposition,
    ...(draft.energyBasis === 'lhv' ? { lhv_J_kg: energy_J_kg } : { heatOfFormation_J_kg: energy_J_kg }),
    ...withoutNulls({ specificHeat_J_kgK }),
    ...(withBed ? withoutNulls({ porosity, bulkDensity_kg_m3, particleSize_m, activityFactor, emissivity }) : {}),
  };
}
