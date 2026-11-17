import { Injectable, NotFoundException } from '@nestjs/common';
import { CompoundGasBounds, STANDARD_CONDITIONS } from '../../../common/thermal';
import { CompoundGasBoundsDto } from '../dto/compound-gas-bounds.dto';

@Injectable()
export class CompoundBoundsService {
  gasBounds(id: string, P_Pa?: number): CompoundGasBoundsDto {
    try {
      return CompoundGasBounds.forCompound(id, P_Pa ?? STANDARD_CONDITIONS.PRESSURE_PA);
    } catch (error) {
      throw new NotFoundException((error as Error).message);
    }
  }
}
