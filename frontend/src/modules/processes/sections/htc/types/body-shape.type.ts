import type { BodyDimensionKey } from './body-dimension-key.type';
import type { BodyShapeKey } from './body-shape-key.type';

export type BodyShape = {
  value: BodyShapeKey;
  label: string;
  dims: ReadonlyArray<{ key: BodyDimensionKey; label: string }>;
  /** Whether the backend applies the insulation thickness `h` to this shape's surface. */
  usesInsulation: boolean;
};
