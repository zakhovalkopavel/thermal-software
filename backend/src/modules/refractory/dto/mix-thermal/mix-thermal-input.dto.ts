import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsNumber, Max, Min, ValidateNested } from 'class-validator';
import { kelvinToCelsius } from '../../../../common/thermal/utils/temperature';
import { MIX_THERMAL_CONSTANTS } from '../../constants/mix-thermal.constants';

const MIN_TEMPERATURE_C = kelvinToCelsius(MIX_THERMAL_CONSTANTS.minTemperature_K);
import { MixComponentInputDto } from '../mix-composition/mix-component-input.dto';

export class MixThermalInputDto {
  @ApiProperty({
    type: [MixComponentInputDto],
    description: 'One material with massFraction 1 for a single fired raw material',
    example: [{ materialId: 'silicon_carbide', massFraction: 1 }],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => MixComponentInputDto)
  fractions: MixComponentInputDto[];

  @ApiProperty({
    type: [Number],
    description: `Temperatures [°C], each ≥ ${MIN_TEMPERATURE_C}`,
    minimum: MIN_TEMPERATURE_C,
    example: [20, 400, 800, 1200],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MIX_THERMAL_CONSTANTS.maxTemperatures)
  @IsNumber({}, { each: true })
  @Min(MIN_TEMPERATURE_C, { each: true })
  temperatures_C: number[];

  @ApiProperty({ description: `Pore volume fraction 0–${MIX_THERMAL_CONSTANTS.porosityMax}`, example: 0.2 })
  @IsNumber()
  @Min(0)
  @Max(MIX_THERMAL_CONSTANTS.porosityMax)
  porosity: number;
}
