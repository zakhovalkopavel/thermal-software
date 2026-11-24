import { IsArray, IsNumber, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { LayerDto } from '../../../thermal-exchange/dto/layer.dto';

export class FurnaceWallDto {
  @ApiProperty({ description: 'Furnace (burnout chamber) inner diameter [m]', example: 0.4, minimum: 0.01 })
  @IsNumber() @Min(0.01)
  diameter_m: number;

  @ApiProperty({ description: 'Furnace length [m]', example: 1.0, minimum: 0.01 })
  @IsNumber() @Min(0.01)
  length_m: number;

  @ApiProperty({ type: [LayerDto], description: 'Furnace wall layers, inside → outside' })
  @IsArray() @ValidateNested({ each: true }) @Type(() => LayerDto)
  wallLayers: LayerDto[];

  @ApiProperty({ description: 'Wall emissivity', example: 0.85, minimum: 0, maximum: 1 })
  @IsNumber() @Min(0) @Max(1)
  emissivity: number;
}
