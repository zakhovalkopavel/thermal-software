import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MaterialGroup } from '../../enums/material-group.enum';
import { MaterialType } from '../../enums/material-type.enum';
import { MaterialParticleSizeDto } from './material-particle-size.dto';
import { MaterialThermalPropertiesDto } from './material-thermal-properties.dto';
import { MaterialMechanicalPropertiesDto } from './material-mechanical-properties.dto';

export class MaterialEntryDto {
  @ApiProperty({ example: 'alumina_tabular' })
  materialId: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: MaterialType })
  type: MaterialType;

  @ApiProperty({ enum: MaterialGroup, isArray: true, description: 'First entry is the primary group' })
  materialGroup: MaterialGroup[];

  @ApiProperty({ description: '1–10 common, 11–20 specialty, 21+ very special' })
  orderNumber: number;

  @ApiProperty()
  description: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'number' },
    description: 'Composition in wt% as stored in the library',
    example: { Al2O3: 99.5, Na2O: 0.3 },
  })
  composition: Record<string, number>;

  @ApiProperty({ description: 'True density after firing [kg/m³]' })
  rho_true_after_firing_kgm3: number;

  @ApiPropertyOptional({ type: [String], description: 'Size codes, see GET /refractory/particle-sizes' })
  availableParticleSizes?: string[];

  @ApiPropertyOptional({ type: MaterialParticleSizeDto })
  particleSize?: MaterialParticleSizeDto;

  @ApiPropertyOptional({ type: MaterialThermalPropertiesDto })
  thermalProperties?: MaterialThermalPropertiesDto;

  @ApiPropertyOptional({ type: MaterialMechanicalPropertiesDto })
  mechanicalProperties?: MaterialMechanicalPropertiesDto;

  @ApiProperty({ description: 'Chemical shrinkage [volume fraction]' })
  chemicalShrinkage_volFrac: number;

  @ApiProperty({ description: 'Sintering activation energy [J/mol]' })
  activationEnergy_Jmol: number;

  @ApiProperty({ description: 'Melting point [°C]' })
  meltingPoint_C: number;

  @ApiPropertyOptional()
  sourceUrl?: string;

  @ApiPropertyOptional()
  supplier?: string;

  @ApiPropertyOptional()
  grade?: string;
}
