import { ApiProperty } from '@nestjs/swagger';
import { ShrinkageStageDto } from './shrinkage-stage.dto';

export class FiringShrinkageDto extends ShrinkageStageDto {
  @ApiProperty()
  sinteringTemperature_C: number;

  @ApiProperty()
  sinteringRate: number;

  @ApiProperty({ description: 'Master sintering curve parameter Θ' })
  masterSinteringCurve_theta: number;
}
