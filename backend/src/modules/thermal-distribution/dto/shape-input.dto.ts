import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Geometry } from '../type/geometry.type';

export class ShapeInputDto {
  @ApiProperty({
    description:
      'Body geometry. Use "auto" to derive the best 1D approximation from V/A ratio.',
    enum: ['plate','cylinder','sphere','hollow_cylinder','parallelepiped','finite_cylinder','auto'],
    example: 'cylinder',
  })
  @IsString()
  geometry: Geometry;

  @ApiPropertyOptional({ description: 'Half-thickness / outer radius (m)', example: 0.05 })
  @IsOptional() @IsNumber() radius?: number;

  @ApiPropertyOptional({ description: 'Inner radius for hollow cylinder (m)', example: 0.02 })
  @IsOptional() @IsNumber() innerRadius?: number;

  @ApiPropertyOptional({ description: 'Outer radius for hollow cylinder (m)', example: 0.05 })
  @IsOptional() @IsNumber() outerRadius?: number;

  @ApiPropertyOptional({ description: 'Parallelepiped half-length x₁ (m)', example: 0.05 })
  @IsOptional() @IsNumber() halfX?: number;

  @ApiPropertyOptional({ description: 'Parallelepiped half-length x₂ (m)', example: 0.05 })
  @IsOptional() @IsNumber() halfY?: number;

  @ApiPropertyOptional({ description: 'Parallelepiped half-length x₃ / finite cylinder half-height (m)', example: 0.05 })
  @IsOptional() @IsNumber() halfZ?: number;

  @ApiPropertyOptional({ description: 'Volume/surface-area ratio for "auto" mode (m)' })
  @IsOptional() @IsNumber() vOverA?: number;
}
