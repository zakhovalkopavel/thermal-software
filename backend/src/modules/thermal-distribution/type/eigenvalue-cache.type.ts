import type { Geometry } from './geometry.type';

export type EigenvalueCache = {
  geometry: Geometry;
  Bi: number;
  terms: number;
  roots: number[]; // μ₁ … μN
};
