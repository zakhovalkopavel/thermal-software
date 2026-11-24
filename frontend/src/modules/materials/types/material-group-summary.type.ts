import type { MaterialGroup } from './material-group.type';
import type { MaterialGroupRoute } from './material-group-route.type';

export type MaterialGroupSummary = {
  group: MaterialGroup;
  route: MaterialGroupRoute;
  label: string;
  count: number;
};
