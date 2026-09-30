import type { WallLayer } from './wall-layer.type';

export type FurnaceWall = {
  diameter_m: number;
  length_m: number;
  wallLayers: WallLayer[];
  emissivity?: number;
};
