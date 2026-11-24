import { ApiProperty } from '@nestjs/swagger';
import { ComponentBreakdownDto } from './component-breakdown.dto';
import { FixedPointsDto } from '../fixed-points/fixed-points.dto';
import { GlassViscosityMetadataDto } from './glass-viscosity-metadata.dto';
import { ViscosityModelInfoDto } from './viscosity-model-info.dto';
import { ViscosityValidationStatusDto } from '../validation/viscosity-validation-status.dto';

export class GlassViscosityResultDto {
  @ApiProperty()
  viscosity_Pas: number;

  @ApiProperty()
  temperature_C: number;

  @ApiProperty({ description: 'log₁₀(η / Pa·s)' })
  logViscosity: number;

  @ApiProperty({ type: ViscosityModelInfoDto })
  model: ViscosityModelInfoDto;

  @ApiProperty({ type: FixedPointsDto })
  fixedPoints: FixedPointsDto;

  @ApiProperty({ type: ViscosityValidationStatusDto })
  validation: ViscosityValidationStatusDto;

  @ApiProperty({ type: ComponentBreakdownDto })
  components: ComponentBreakdownDto;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'number' }, description: 'Normalized composition used for the calculation' })
  composition: Record<string, number>;

  @ApiProperty({ type: GlassViscosityMetadataDto })
  metadata: GlassViscosityMetadataDto;
}
