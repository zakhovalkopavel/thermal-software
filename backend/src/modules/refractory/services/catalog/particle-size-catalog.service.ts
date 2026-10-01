import { Injectable } from '@nestjs/common';
import {
  CEMENT_PARTICLE_SIZES,
  FEPA_F_SIZES,
  FEPA_P_SIZES,
  MESH_PARTICLE_SIZES,
  PARTICLE_SIZE_CLASSIFICATIONS,
  STANDARD_PARTICLE_SIZES,
} from '../../data/particle-sizes.data';
import { ParticleSizesDto } from '../../dto/material-catalog/particle-sizes.dto';

/** Read-only access to the standard particle-size tables. */
@Injectable()
export class ParticleSizeCatalogService {
  getParticleSizes(): ParticleSizesDto {
    return {
      standard:        STANDARD_PARTICLE_SIZES,
      classifications: PARTICLE_SIZE_CLASSIFICATIONS,
      cement:          CEMENT_PARTICLE_SIZES,
      mesh:            MESH_PARTICLE_SIZES,
      fepaF:           FEPA_F_SIZES,
      fepaP:           FEPA_P_SIZES,
    };
  }
}
