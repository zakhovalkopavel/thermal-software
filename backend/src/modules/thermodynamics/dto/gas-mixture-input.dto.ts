import { IsEnum, IsNumber, IsObject, IsOptional, IsString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Species } from '../enums/species.enum';

export class GasMixtureInputDto {
  @ApiProperty({ description: 'Mole or mass fractions by species, must sum to 1' })
  @IsObject()
  composition: Partial<Record<Species, number>>;

  @ApiProperty({ description: 'Temperature [K]', minimum: 100, maximum: 6000 })
  @IsNumber() @Min(100) @Max(6000)
  T_K: number;

  @ApiPropertyOptional({ description: 'Pressure [atm], default 1.0', minimum: 0.1, maximum: 300 })
  @IsOptional() @IsNumber() @Min(0.1) @Max(300)
  P_atm?: number;

  @ApiPropertyOptional({ enum: ['mole', 'mass'], description: 'Fraction type, default mole' })
  @IsOptional() @IsString()
  fractionType?: 'mole' | 'mass';
}

