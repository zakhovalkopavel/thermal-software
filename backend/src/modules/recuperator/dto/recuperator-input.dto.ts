import { IsBoolean, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HoleForm } from '../enums/hole-form.enum';

export class RecuperatorInputDto {
  @ApiProperty({ description: 'Furnace power [W]', example: 1_000_000, minimum: 0 })
  @IsNumber() @Min(0) fPower_W: number;

  @ApiProperty({ description: 'Lower heating value of fuel [J/kg]', example: 35_000_000, minimum: 1 })
  @IsNumber() @Min(1) fuelQ_Jkg: number;

  @ApiProperty({ description: 'Excess air ratio (1.0 = stoichiometric)', example: 1.2, minimum: 0.01 })
  @IsNumber() @Min(0.01) kExcessAir: number;

  @ApiProperty({ description: 'Inlet air temperature [K]', example: 573, minimum: 200 })
  @IsNumber() @Min(200) tAirStart_K: number;

  @ApiProperty({ enum: HoleForm, description: 'Channel cross-section geometry', example: HoleForm.CIRCLE })
  @IsEnum(HoleForm) holeForm: HoleForm;

  @ApiProperty({ description: 'Nominal channel dimension — diameter for CIRCLE, side for SQUARE [m]', example: 0.04, minimum: 0.001 })
  @IsNumber() @Min(0.001) d0_m: number;

  @ApiPropertyOptional({ description: 'Air annular gap depth [m] — CIRCLE_IN_RING only', example: 0.01, minimum: 0 })
  @IsOptional() @IsNumber() @Min(0) h0_m?: number;

  @ApiProperty({ description: 'Refractory wall thickness between smoke and air channels [m]', example: 0.003, minimum: 0.001 })
  @IsNumber() @Min(0.001) refractoryThickness_m: number;

  @ApiProperty({ description: 'Number of air channels', example: 100, minimum: 1 })
  @IsNumber() @Min(1) nAir: number;

  @ApiProperty({ description: 'Number of smoke channels', example: 81, minimum: 1 })
  @IsNumber() @Min(1) nSmoke: number;

  @ApiPropertyOptional({ description: 'Air passes (CIRCLE_IN_RING only, default 1)', example: 1, minimum: 1 })
  @IsOptional() @IsNumber() @Min(1) nPasses?: number;

  @ApiPropertyOptional({ description: 'Enable smoke turbulence correction (default false)', example: false })
  @IsOptional() @IsBoolean() smokeTurbulence?: boolean;

  @ApiProperty({ description: 'Target recuperator length [m]', example: 1.5, minimum: 0.1 })
  @IsNumber() @Min(0.1) wantedRecuperatorLength_m: number;

  @ApiProperty({ description: 'Outer thermal insulation thickness [m]', example: 0.05, minimum: 0 })
  @IsNumber() @Min(0) thermalInsulationThickness_m: number;

  @ApiProperty({ description: 'Refractory wall thermal conductivity [W/(m·K)]', example: 1.2, minimum: 0.01 })
  @IsNumber() @Min(0.01) refractoryLambda_WmK: number;

  @ApiProperty({ description: 'Refractory wall emissivity [0–1]', example: 0.85, minimum: 0 })
  @IsNumber() @Min(0) refractoryEmissivity: number;

  @ApiProperty({ description: 'Outer shell surface emissivity [0–1]', example: 0.9, minimum: 0 })
  @IsNumber() @Min(0) surfaceEmissivity: number;

  @ApiProperty({ description: 'Outer surface area [m²]', example: 5.0, minimum: 0 })
  @IsNumber() @Min(0) surfaceArea_m2: number;

  @ApiPropertyOptional({ description: 'Water mass fraction in air — humidity (default 0)', example: 0.01, minimum: 0 })
  @IsOptional() @IsNumber() @Min(0) wH2Om?: number;

  @ApiPropertyOptional({ description: 'Air preheat offset [K] for max flame temp (default 0)', example: 0 })
  @IsOptional() @IsNumber() airPreheat_K?: number;

  @ApiPropertyOptional({ description: 'O₂ vol fraction in dry air (default 0.21)', example: 0.21 })
  @IsOptional() @IsNumber() pO2?: number;
}
