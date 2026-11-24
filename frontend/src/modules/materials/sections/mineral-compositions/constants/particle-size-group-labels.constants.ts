import type { ParticleSizes } from '../../../types/particle-sizes.type';

export const PARTICLE_SIZE_GROUP_LABELS: Record<keyof ParticleSizes, string> = {
  standard: 'Standard classes',
  classifications: 'Classifications',
  cement: 'Cement',
  mesh: 'Mesh',
  fepaF: 'FEPA F',
  fepaP: 'FEPA P',
};
