import { IsEnum, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BodyGeometry } from '../enums/body-geometry.enum';
import { GeometryDimsDto } from './geometry-dims.dto';

export class BodyGeometryInputDto {
  @ApiProperty({
    enum: BodyGeometry,
    description: 'Body shape key. Determines which dimension fields are required in `dimensions`.',
  })
  @IsEnum(BodyGeometry)
  geometry: BodyGeometry;

  @ApiPropertyOptional({ description: 'Insulation thickness [m]', minimum: 0 })
  @IsOptional() @IsNumber() h?: number;

  @ApiProperty({
    type: GeometryDimsDto,
    description:
      'Shape dimensions. ' +
      'sphere → {a: diameter [m]}; ' +
      'cube → {a: side [m]}; ' +
      'cylinder → {a: diameter [m], b: height [m]}; ' +
      'rectangular_box → {a: width, b: height, c: depth}.',
    example: { a: 0.1 },
  })
  @ValidateNested() @Type(() => GeometryDimsDto)
  dimensions: GeometryDimsDto;
}
