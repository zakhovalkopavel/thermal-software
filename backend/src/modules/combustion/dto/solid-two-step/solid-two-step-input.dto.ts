import { IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CondensedFuelSupplyDto } from '../common';

export class SolidTwoStepInputDto extends CondensedFuelSupplyDto {
  @ApiProperty({ description: 'Total excess air ratio λ (primary + secondary)', example: 1.2, minimum: 0.01 })
  @IsNumber() @Min(0.01)
  kExcessAir: number;

  @ApiPropertyOptional({
    description: 'Primary (generator) excess air ratio; default — the air that takes C to CO (O/C = 1)',
    example: 0.45, minimum: 0,
  })
  @IsOptional() @IsNumber() @Min(0)
  primaryExcessAir?: number;

  @ApiProperty({ description: 'Primary air temperature [K]', example: 293, minimum: 200 })
  @IsNumber() @Min(200)
  tAirPrimary_K: number;

  @ApiPropertyOptional({ description: 'Secondary air temperature [K] (default = primary)', example: 573, minimum: 200 })
  @IsOptional() @IsNumber() @Min(200)
  tAirSecondary_K?: number;

  @ApiPropertyOptional({ description: 'Generator wall heat loss [W]; overrides flux × surface', example: 0, minimum: 0 })
  @IsOptional() @IsNumber() @Min(0)
  generatorHeatLoss_W?: number;

  @ApiPropertyOptional({ description: 'Generator inner wall heat flux [W/m²] (legacy default 7000)', example: 7000, minimum: 0 })
  @IsOptional() @IsNumber() @Min(0)
  generatorHeatFlux_Wm2?: number;

  @ApiPropertyOptional({ description: 'Generator inner wall surface [m²]', example: 0.2, minimum: 0 })
  @IsOptional() @IsNumber() @Min(0)
  generatorSurface_m2?: number;

  @ApiPropertyOptional({ description: 'Furnace (burnout zone) heat loss [W] (default 0)', example: 0, minimum: 0 })
  @IsOptional() @IsNumber() @Min(0)
  furnaceHeatLoss_W?: number;
}
