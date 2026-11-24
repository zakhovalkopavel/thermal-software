import { ApiProperty } from '@nestjs/swagger';
import { ViscosityValidationStatusDto } from '../validation/viscosity-validation-status.dto';
import { VtfParametersDto } from './vtf-parameters.dto';

export class TemperatureAtViscosityResultDto {
  @ApiProperty({ description: 'Human-readable model name' })
  model: string;

  @ApiProperty({ required: false, description: 'VTF models only' })
  modelRef?: string;

  @ApiProperty({ description: 'log₁₀(η / Pa·s)' })
  targetLogEta: number;

  @ApiProperty()
  temperature_C: number;

  @ApiProperty({ type: VtfParametersDto, required: false, description: 'VTF models only' })
  vtfParameters?: VtfParametersDto;

  @ApiProperty({ required: false, description: 'Slag models only' })
  secondaryModel?: string;

  @ApiProperty({ type: ViscosityValidationStatusDto })
  validation: ViscosityValidationStatusDto;
}
