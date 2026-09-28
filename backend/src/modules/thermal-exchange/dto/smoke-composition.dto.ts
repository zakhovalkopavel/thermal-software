import { IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SmokeCompositionDto {
  @ApiProperty({ description: 'N₂ mole fraction', example: 0.72, minimum: 0, maximum: 1 })
  @IsNumber() @Min(0) @Max(1) N2:  number;

  @ApiProperty({ description: 'O₂ mole fraction', example: 0.02, minimum: 0, maximum: 1 })
  @IsNumber() @Min(0) @Max(1) O2:  number;

  @ApiProperty({ description: 'CO₂ mole fraction', example: 0.13, minimum: 0, maximum: 1 })
  @IsNumber() @Min(0) @Max(1) CO2: number;

  @ApiProperty({ description: 'CO mole fraction', example: 0, minimum: 0, maximum: 1 })
  @IsNumber() @Min(0) @Max(1) CO:  number;

  @ApiProperty({ description: 'H₂O mole fraction', example: 0.13, minimum: 0, maximum: 1 })
  @IsNumber() @Min(0) @Max(1) H2O: number;

  @ApiProperty({ description: 'H₂ mole fraction', example: 0, minimum: 0, maximum: 1 })
  @IsOptional() @IsNumber() @Min(0) @Max(1) H2:  number;
}
