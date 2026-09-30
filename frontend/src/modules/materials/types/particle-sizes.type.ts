import type { ParticleSizeRange } from './particle-size-range.type';

export type ParticleSizes = {
  standard: Record<string, ParticleSizeRange>;
  classifications: Record<string, ParticleSizeRange>;
  cement: Record<string, ParticleSizeRange>;
  mesh: Record<string, ParticleSizeRange>;
  fepaF: Record<string, ParticleSizeRange>;
  fepaP: Record<string, ParticleSizeRange>;
};
