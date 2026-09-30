import { IsEnum, IsNumber, IsObject, IsOptional, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FuelPhase } from '../data/fuels/fuel.interface';
import { FuelId } from '../enums/fuel-id.enum';
import { CondensedFuelDto, FuelSummaryDto } from './condensed-fuel.dto';
import { CombustionStepResultDto } from './combustion-step-result.dto';

export class FluidFuelInputDto {
  @ApiProperty({ enum: [FuelPhase.Gas, FuelPhase.Liquid], example: FuelPhase.Gas })
  @IsEnum(FuelPhase)
  phase: FuelPhase.Gas | FuelPhase.Liquid;

  @ApiPropertyOptional({ enum: [FuelId.MapPro], description: 'Gaseous fuel preset (alternative to `fuelGas`)' })
  @IsOptional() @IsEnum(FuelId)
  fuelId?: FuelId;

  @ApiPropertyOptional({
    description: 'Gaseous fuel: mole fractions by species (CH4, C2H6, C3H8, C4H10, iC4H10, C2H2, C3H4, aC3H4, ' +
      'C3H6, H2, CO, CO2, N2, H2O, Ar); normalised',
    type: 'object', additionalProperties: { type: 'number' },
    example: { CH4: 0.95, CO2: 0.01, N2: 0.04 },
  })
  @IsOptional() @IsObject()
  fuelGas?: Record<string, number>;

  @ApiPropertyOptional({ type: CondensedFuelDto, description: 'Liquid fuel: elemental analysis + ΔHf or LHV' })
  @IsOptional() @ValidateNested() @Type(() => CondensedFuelDto)
  fuel?: CondensedFuelDto;

  @ApiPropertyOptional({ description: 'Fuel mass flow [kg/s] (alternative to fPower_W)', example: 0.0004, minimum: 0 })
  @IsOptional() @IsNumber() @Min(0)
  mFuel_kgs?: number;

  @ApiPropertyOptional({ description: 'Fuel power on LHV basis [W] (alternative to mFuel_kgs)', example: 20_000, minimum: 0 })
  @IsOptional() @IsNumber() @Min(0)
  fPower_W?: number;

  @ApiProperty({ description: 'Excess air ratio λ', example: 1.1, minimum: 0.01 })
  @IsNumber() @Min(0.01)
  kExcessAir: number;

  @ApiProperty({ description: 'Air temperature [K]', example: 293, minimum: 200 })
  @IsNumber() @Min(200)
  tAir_K: number;

  @ApiPropertyOptional({ description: 'Fuel inlet temperature [K] (default 298.15)', example: 298.15, minimum: 200 })
  @IsOptional() @IsNumber() @Min(200)
  tFuel_K?: number;

  @ApiPropertyOptional({ description: 'O₂ vol fraction in dry air (default 0.21)', example: 0.21, minimum: 0.01, maximum: 1 })
  @IsOptional() @IsNumber() @Min(0.01) @Max(1)
  pO2?: number;

  @ApiPropertyOptional({ description: 'Air humidity — water mass per mass of dry air (default 0)', example: 0, minimum: 0 })
  @IsOptional() @IsNumber() @Min(0)
  wH2Om?: number;

  @ApiPropertyOptional({ description: 'Heat removed from the flame [W] (default 0)', example: 0, minimum: 0 })
  @IsOptional() @IsNumber() @Min(0)
  heatLoss_W?: number;
}

export class FluidFuelResultDto {
  @ApiProperty({ type: FuelSummaryDto }) fuel: FuelSummaryDto;
  @ApiProperty({ description: 'Fuel mass flow [kg/s]' }) mFuel_kgs: number;
  @ApiProperty({ description: 'Fuel power, LHV basis [W]' }) fPower_W: number;
  @ApiProperty({ description: 'Air mass flow incl. humidity [kg/s]' }) mAir_kgs: number;
  @ApiProperty({ description: 'Flame temperature [K]' }) tFlame_K: number;
  @ApiProperty({ type: CombustionStepResultDto }) combustion: CombustionStepResultDto;
}
