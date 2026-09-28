import { MaterialGroup } from '../enums/material-group.enum';

/**
 * Primary material groups (`materialGroup[0]`) allowed as raw materials in a mix.
 * Order defines the group order of `GET /refractory/mix-components`.
 * Extend here to admit new groups (e.g. borates, phosphates, fluorides).
 */
export const MIX_COMPONENT_GROUPS: ReadonlyArray<MaterialGroup> = [
  MaterialGroup.BINDER,
  MaterialGroup.OXIDE,
  MaterialGroup.SILICATE,
  MaterialGroup.CLAY,
  MaterialGroup.CARBIDE,
  MaterialGroup.NITRIDE,
];
