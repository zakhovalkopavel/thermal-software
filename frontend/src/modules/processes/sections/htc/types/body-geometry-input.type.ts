import type { BodyDimensionKey } from './body-dimension-key.type';
import type { BodyShapeKey } from './body-shape-key.type';

export type BodyGeometryInput = {
  geometry: BodyShapeKey;
  h?: number;
  dimensions: Partial<Record<BodyDimensionKey, number>>;
};
