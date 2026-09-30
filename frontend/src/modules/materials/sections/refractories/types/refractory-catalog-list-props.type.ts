import type { RefractoryGroup } from '../../../types/refractory-group.type';

export type RefractoryCatalogListProps = {
  groups: RefractoryGroup[];
  selected: string[];
  onChange: (selected: string[]) => void;
  max: number;
};
