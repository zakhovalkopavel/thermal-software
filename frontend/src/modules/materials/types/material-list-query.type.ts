import type { MaterialType } from './material-type.type';

export type MaterialListQuery = {
  type?: MaterialType;
  search?: string;
};
