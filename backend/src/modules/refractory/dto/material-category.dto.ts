import { ApiProperty } from '@nestjs/swagger';
import { MaterialGroup } from '../enums/material-group.enum';
import { MaterialEntryDto } from './material-entry.dto';

export class MaterialCategoryDto {
  @ApiProperty({ enum: MaterialGroup, description: 'Primary group (materialGroup[0]) shared by the materials' })
  group: MaterialGroup;

  @ApiProperty({ example: 'Oxides' })
  label: string;

  @ApiProperty({ type: [MaterialEntryDto] })
  materials: MaterialEntryDto[];
}
