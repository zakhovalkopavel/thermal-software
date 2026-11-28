import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CompoundGasBounds,
  CompoundLiquidBounds,
  STANDARD_CONDITIONS,
} from '../../../common/thermal';
import { CompoundGasBoundsDto } from '../dto/compound-gas-bounds.dto';
import { CompoundLiquidBoundsDto } from '../dto/compound-liquid-bounds.dto';

@Injectable()
export class CompoundBoundsService {
  gasBounds(id: string, P_Pa?: number): CompoundGasBoundsDto {
    try {
      return CompoundGasBounds.forCompound(id, P_Pa ?? STANDARD_CONDITIONS.PRESSURE_PA);
    } catch (error) {
      throw new NotFoundException((error as Error).message);
    }
  }

  liquidBounds(id: string, P_Pa?: number): CompoundLiquidBoundsDto {
    try {
      return CompoundLiquidBounds.forCompound(id, P_Pa ?? STANDARD_CONDITIONS.PRESSURE_PA);
    } catch (error) {
      throw new NotFoundException((error as Error).message);
    }
  }
}
