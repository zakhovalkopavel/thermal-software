import { ApiProperty } from '@nestjs/swagger';
import { FixedPointsDto } from '../fixed-points/fixed-points.dto';
import { ViscosityProfilePointDto } from './viscosity-profile-point.dto';
import { ViscosityValidationStatusDto } from '../validation/viscosity-validation-status.dto';
import { VtfParametersDto } from './vtf-parameters.dto';

export class GlassViscosityProfileResultDto {
  @ApiProperty({ description: 'Human-readable model name' })
  model: string;

  @ApiProperty({ required: false, description: 'VTF models only' })
  modelRef?: string;

  @ApiProperty({ type: VtfParametersDto, required: false, description: 'VTF models only' })
  vtfParameters?: VtfParametersDto;

  @ApiProperty({ type: [ViscosityProfilePointDto] })
  points: ViscosityProfilePointDto[];

  @ApiProperty({ type: FixedPointsDto, nullable: true, description: 'null for slag and Hetherington models' })
  fixedPoints: FixedPointsDto | null;

  @ApiProperty({ required: false, description: 'Slag models only' })
  secondaryModel?: string;

  @ApiProperty({ type: ViscosityValidationStatusDto })
  validation: ViscosityValidationStatusDto;
}
