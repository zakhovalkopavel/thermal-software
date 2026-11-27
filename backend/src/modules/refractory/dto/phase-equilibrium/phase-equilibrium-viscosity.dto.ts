import { ApiProperty } from '@nestjs/swagger';
import { ConfidenceLevel } from '../../enums/confidence-level.enum';
import { ViscosityModel } from '../../enums/viscosity-model.enum';

export class PhaseEquilibriumViscosityDto {
  @ApiProperty({ enum: ViscosityModel })
  model: ViscosityModel;

  @ApiProperty({ enum: ConfidenceLevel })
  confidence: ConfidenceLevel;

  @ApiProperty({ description: 'log₁₀(η / Pa·s) at the firing temperature' })
  logViscosity: number;

  @ApiProperty({ description: 'η [Pa·s] at the firing temperature' })
  viscosity_Pas: number;
}
