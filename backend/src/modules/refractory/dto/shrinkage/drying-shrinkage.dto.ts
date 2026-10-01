import { ApiProperty } from '@nestjs/swagger';
import { ShrinkageStageDto } from './shrinkage-stage.dto';

export class DryingShrinkageDto extends ShrinkageStageDto {
  @ApiProperty()
  waterRemoved_percent: number;

  @ApiProperty()
  chemicalShrinkageCoefficient: number;
}
