import { IsNumber, IsOptional, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ElementalCompositionDto {
  @ApiProperty({ description: 'Carbon mass fraction', example: 0.85, minimum: 0, maximum: 1 })
  @IsNumber() @Min(0) @Max(1) C: number;

  @ApiProperty({ description: 'Hydrogen mass fraction', example: 0.03, minimum: 0, maximum: 1 })
  @IsNumber() @Min(0) @Max(1) H: number;

  @ApiProperty({ description: 'Oxygen mass fraction', example: 0.10, minimum: 0, maximum: 1 })
  @IsNumber() @Min(0) @Max(1) O: number;

  @ApiProperty({ description: 'Nitrogen mass fraction', example: 0.01, minimum: 0, maximum: 1 })
  @IsNumber() @Min(0) @Max(1) N: number;

  @ApiPropertyOptional({ description: 'Sulfur mass fraction', example: 0, minimum: 0, maximum: 1 })
  @IsOptional() @IsNumber() @Min(0) @Max(1) S?: number;

  @ApiProperty({ description: 'Ash mass fraction', example: 0.01, minimum: 0, maximum: 1 })
  @IsNumber() @Min(0) @Max(1) ash: number;

  @ApiPropertyOptional({ description: 'Moisture (free water) mass fraction', example: 0, minimum: 0, maximum: 1 })
  @IsOptional() @IsNumber() @Min(0) @Max(1) moisture?: number;
}
