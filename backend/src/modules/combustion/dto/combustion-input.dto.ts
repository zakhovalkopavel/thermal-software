import { IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CombustionInputDto {
  @ApiProperty({ description: 'Furnace power [W]', example: 1_000_000, minimum: 0 })
  @IsNumber() @Min(0)
  fPower_W: number;

  @ApiProperty({ description: 'Lower heating value of fuel [J/kg]', example: 35_000_000, minimum: 1 })
  @IsNumber() @Min(1)
  fuelQ_Jkg: number;

  @ApiPropertyOptional({ description: 'Carbon-equivalent LHV [J/kg] (default 32 900 000)', example: 32_900_000 })
  @IsOptional() @IsNumber() @Min(1)
  carbonQ_Jkg?: number;

  @ApiProperty({ description: 'Excess air ratio — 1.0 = stoichiometric, typical 1.1–1.5', example: 1.2, minimum: 0.01 })
  @IsNumber() @Min(0.01)
  kExcessAir: number;

  @ApiProperty({ description: 'Inlet air / initial gas temperature [K]', example: 573, minimum: 200 })
  @IsNumber() @Min(200)
  tAirStart_K: number;

  @ApiPropertyOptional({ description: 'O₂ vol fraction in dry air (default 0.21)', example: 0.21, minimum: 0.01 })
  @IsOptional() @IsNumber() @Min(0.01)
  pO2?: number;

  @ApiPropertyOptional({ description: 'Water mass fraction in air — humidity (default 0)', example: 0.01, minimum: 0 })
  @IsOptional() @IsNumber() @Min(0)
  wH2Om?: number;

  @ApiPropertyOptional({ description: 'Generator surface heat loss [W] (default 0)', example: 0, minimum: 0 })
  @IsOptional() @IsNumber() @Min(0)
  generatorHeatLoss_W?: number;
}
