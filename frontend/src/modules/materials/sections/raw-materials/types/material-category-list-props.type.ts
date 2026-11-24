import type { MaterialCategory } from '../../../types/material-category.type';
import type { MaterialGroup } from '../../../types/material-group.type';

export type MaterialCategoryListProps = {
  categories: MaterialCategory[];
  expanded: MaterialGroup | null;
  onExpand: (group: MaterialGroup | null) => void;
  selectedId: string | null;
  onSelect: (materialId: string, group: MaterialGroup) => void;
};
