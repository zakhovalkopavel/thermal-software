import type { BodyDimensionKey } from './body-dimension-key.type';
import type { BodyShapeKey } from './body-shape-key.type';

export type BodyGeometryDraft = {
  geometry: BodyShapeKey;
  dims: Record<BodyDimensionKey, number | null>;
  h: number | null;
};
