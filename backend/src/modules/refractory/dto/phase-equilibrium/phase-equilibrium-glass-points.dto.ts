import { ApiProperty } from '@nestjs/swagger';
import { ConfidenceLevel } from '../../enums/confidence-level.enum';
import { ViscosityModel } from '../../enums/viscosity-model.enum';

export class PhaseEquilibriumGlassPointsDto {
  @ApiProperty({ enum: ViscosityModel })
  model: ViscosityModel;

  @ApiProperty({ enum: ConfidenceLevel })
  confidence: ConfidenceLevel;

  @ApiProperty({ description: 'Strain point, η = 10¹³·⁵ Pa·s [°C]' })
  strainPoint_C: number;

  @ApiProperty({ description: 'Annealing / glass-transition point, η = 10¹² Pa·s [°C]' })
  glassTransition_C: number;

  @ApiProperty({ description: 'Softening point, η = 10⁶·⁶ Pa·s [°C]' })
  softeningPoint_C: number;

  @ApiProperty({ description: 'Working point, η = 10³ Pa·s [°C]' })
  workingPoint_C: number;
}
