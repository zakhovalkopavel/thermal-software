import { ApiProperty } from '@nestjs/swagger';
import { ConductionLaw } from '../../enums/conduction-law.enum';
import { ThermalReferenceSource } from '../../enums/thermal-reference-source.enum';

export class MixThermalMaterialDto {
  @ApiProperty({ example: 'silicon_carbide' })
  materialId: string;

  @ApiProperty({ description: 'Share of the fired mix mass (0–1)' })
  firedMassFraction: number;

  @ApiProperty({ description: 'Share of the dense fired mix volume (0–1)' })
  volumeFraction: number;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'number' },
    description: 'Phases of the fired material [wt%, Σ = 100]',
    example: { SiC: 98.99, C: 0.5, SiO2: 0.5 },
  })
  firedPhases_wt: Record<string, number>;

  @ApiProperty({ description: 'True density after firing [kg/m³] (library)' })
  trueDensity_kgm3: number;

  @ApiProperty({ description: 'Dense solid conductivity at the reference temperature [W/(m·K)]' })
  lambdaReference_WmK: number;

  @ApiProperty({ enum: ThermalReferenceSource })
  lambdaReferenceSource: ThermalReferenceSource;

  @ApiProperty({ enum: ConductionLaw, description: 'From the dominant fired phase' })
  conductionLaw: ConductionLaw;

  @ApiProperty({ description: 'Share of the fired material mass with NASA-9 Cp [wt%]' })
  heatCapacityCoverage_wt: number;
}
