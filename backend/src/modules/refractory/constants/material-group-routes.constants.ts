import { MaterialGroup } from '../enums/material-group.enum';
import { MaterialGroupRoute } from '../enums/material-group-route.enum';

/**
 * Single source of truth for the material library groups exposed by the API:
 * order and labels of `GET /refractory/material-groups` and
 * `GET /refractory/material-categories`, and the route → group mapping of
 * `GET /refractory/:groupRoute`.
 */
export const MATERIAL_GROUP_ROUTES: ReadonlyArray<{
  route: MaterialGroupRoute;
  group: MaterialGroup;
  label: string;
}> = [
  { route: MaterialGroupRoute.OXIDES,        group: MaterialGroup.OXIDE,        label: 'Oxides' },
  { route: MaterialGroupRoute.SILICATES,     group: MaterialGroup.SILICATE,     label: 'Silicates' },
  { route: MaterialGroupRoute.CLAYS,         group: MaterialGroup.CLAY,         label: 'Clays' },
  { route: MaterialGroupRoute.BINDERS,       group: MaterialGroup.BINDER,       label: 'Binders' },
  { route: MaterialGroupRoute.CARBIDES,      group: MaterialGroup.CARBIDE,      label: 'Carbides' },
  { route: MaterialGroupRoute.NITRIDES,      group: MaterialGroup.NITRIDE,      label: 'Nitrides' },
  { route: MaterialGroupRoute.BORIDES,       group: MaterialGroup.BORIDE,       label: 'Borides' },
  { route: MaterialGroupRoute.GLASSES,       group: MaterialGroup.GLASS,        label: 'Glasses' },
  { route: MaterialGroupRoute.FLUXES,        group: MaterialGroup.FLUX,         label: 'Fluxes' },
  { route: MaterialGroupRoute.FLUORIDES,     group: MaterialGroup.FLUORIDE,     label: 'Fluorides' },
  { route: MaterialGroupRoute.BORATES,       group: MaterialGroup.BORATE,       label: 'Borates' },
  { route: MaterialGroupRoute.PHOSPHATES,    group: MaterialGroup.PHOSPHATE,    label: 'Phosphates' },
  { route: MaterialGroupRoute.RARE_EARTHS,   group: MaterialGroup.RARE_EARTH,   label: 'Rare earths' },
  { route: MaterialGroupRoute.GLASS_FORMERS, group: MaterialGroup.GLASS_FORMER, label: 'Glass formers' },
  { route: MaterialGroupRoute.HYDROXIDES,    group: MaterialGroup.HYDROXIDE,    label: 'Hydroxides' },
  { route: MaterialGroupRoute.GELS,          group: MaterialGroup.GEL,          label: 'Gels' },
  { route: MaterialGroupRoute.CARBONATES,    group: MaterialGroup.CARBONATE,    label: 'Carbonates' },
];
