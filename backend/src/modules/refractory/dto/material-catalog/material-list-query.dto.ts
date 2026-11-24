import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { MaterialType } from '../../enums/material-type.enum';
import { MATERIAL_CATALOG_CONSTANTS } from '../../constants/material-catalog.constants';

export class MaterialListQueryDto {
  @ApiPropertyOptional({ enum: MaterialType, description: 'Filter by material type' })
  @IsOptional()
  @IsEnum(MaterialType)
  type?: MaterialType;

  @ApiPropertyOptional({
    description: 'Case-insensitive substring of materialId or name',
    maxLength: MATERIAL_CATALOG_CONSTANTS.SEARCH_MAX_LENGTH,
    example: 'alumina',
  })
  @IsOptional()
  @IsString()
  @MaxLength(MATERIAL_CATALOG_CONSTANTS.SEARCH_MAX_LENGTH)
  search?: string;
}
