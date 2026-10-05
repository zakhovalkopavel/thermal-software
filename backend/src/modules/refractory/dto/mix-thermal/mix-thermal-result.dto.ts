import { ApiProperty } from '@nestjs/swagger';
import { MixThermalMaterialDto } from './mix-thermal-material.dto';
import { MixThermalPointDto } from './mix-thermal-point.dto';

export class MixThermalResultDto {
  @ApiProperty({ description: 'Pore volume fraction (0–1)' })
  porosity: number;

  @ApiProperty({ description: 'Loss on ignition (H2O, CO2, OH, Organic) [wt% of raw mix]' })
  lossOnIgnition_wt: number;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'number' },
    description: 'Phases of the fired mix [wt%, Σ = 100]; non-oxide phases (SiC, TiN, …) are kept',
    example: { SiC: 98.99, C: 0.5, SiO2: 0.5 },
  })
  firedPhases_wt: Record<string, number>;

  @ApiProperty({ description: 'Share of the fired mix mass with NASA-9 Cp [wt%]' })
  heatCapacityCoverage_wt: number;

  @ApiProperty({ description: 'True density of the fired mix [kg/m³]' })
  trueDensity_kgm3: number;

  @ApiProperty({ description: 'ρ_true · (1 − P) [kg/m³]' })
  bulkDensity_kgm3: number;

  @ApiProperty({ type: [MixThermalMaterialDto] })
  materials: MixThermalMaterialDto[];

  @ApiProperty({ type: [MixThermalPointDto], description: 'One point per requested temperature, same order' })
  points: MixThermalPointDto[];

  @ApiProperty({ type: [String] })
  warnings: string[];
}
