import {
  IsNotEmpty, IsNumber, IsObject, IsOptional, IsEnum, IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// ─── Shared model selector ────────────────────────────────────────────────────

/**
 * Optional model override for glass viscosity endpoints.
 * When omitted the service auto-selects the best model for the composition.
 * If the requested model is out of range, the best valid model is used instead
 * (the response will indicate which model was actually applied).
 */
export enum GlassViscosityModelDto {
  LAKATOS_1976      = 'LAKATOS_1976',
  FLUEGEL_2007      = 'FLUEGEL_2007',
  HETHERINGTON_1964 = 'HETHERINGTON_1964',
}

// ─── Shared composition property ─────────────────────────────────────────────

const compositionProp = () =>
  ApiProperty({
    description: 'Oxide composition in **wt%**. Keys: SiO2, Al2O3, Na2O, K2O, Li2O, CaO, MgO, BaO, ZnO, PbO, B2O3, Fe2O3, TiO2, ZrO2, SrO, F, SO3, MnO, etc.',
    example: { SiO2: 72.2, Na2O: 13.4, CaO: 11.2, MgO: 1.5, Al2O3: 1.3, K2O: 0.4 },
    type: 'object',
    additionalProperties: { type: 'number' },
  });

const modelProp = () =>
  ApiProperty({
    enum: GlassViscosityModelDto,
    required: false,
    description:
      'Model to apply. Auto-selected when omitted. ' +
      'If the requested model is out of range for the composition, ' +
      'the best valid model is used and noted in the response.',
  });

// ─── 1. Single viscosity at a temperature ────────────────────────────────────

export class GlassViscosityDto {
  @compositionProp()
  @IsNotEmpty()
  @IsObject()
  composition: Record<string, number>;

  @ApiProperty({ example: 1200, description: 'Temperature in °C' })
  @IsNotEmpty()
  @IsNumber()
  temperature: number;

  @modelProp()
  @IsEnum(GlassViscosityModelDto)
  @IsOptional()
  model?: GlassViscosityModelDto;
}

// ─── 2. Viscosity profile over a set of temperatures ─────────────────────────

export class GlassViscosityProfileDto {
  @compositionProp()
  @IsNotEmpty()
  @IsObject()
  composition: Record<string, number>;

  @ApiProperty({
    example: [800, 900, 1000, 1100, 1200, 1300, 1400],
    description: 'Temperatures in °C at which to evaluate log η',
  })
  @IsNotEmpty()
  @IsArray()
  @IsNumber({}, { each: true })
  temperatures_C: number[];

  @modelProp()
  @IsEnum(GlassViscosityModelDto)
  @IsOptional()
  model?: GlassViscosityModelDto;
}

// ─── 3. Temperature at a target viscosity ────────────────────────────────────

export class GlassTemperatureAtViscosityDto {
  @compositionProp()
  @IsNotEmpty()
  @IsObject()
  composition: Record<string, number>;

  @ApiProperty({
    example: 3.0,
    description: 'Target log₁₀(η / Pa·s). Common values: 1.0 melting, 3.0 working, 6.6 softening, 12.0 annealing, 13.5 strain',
  })
  @IsNotEmpty()
  @IsNumber()
  targetLogEta: number;

  @modelProp()
  @IsEnum(GlassViscosityModelDto)
  @IsOptional()
  model?: GlassViscosityModelDto;
}

// ─── 4. Composition conversion ────────────────────────────────────────────────

export enum ConversionDirectionDto {
  WT_TO_MOL = 'wt_to_mol',
  MOL_TO_WT = 'mol_to_wt',
}

export class GlassCompositionConvertDto {
  @ApiProperty({
    description: 'Input composition. Interpreted as wt% when direction=wt_to_mol, as mol% when direction=mol_to_wt.',
    example: { SiO2: 72.2, Na2O: 13.4, CaO: 11.2, MgO: 1.5, Al2O3: 1.7 },
    type: 'object',
    additionalProperties: { type: 'number' },
  })
  @IsNotEmpty()
  @IsObject()
  composition: Record<string, number>;

  @ApiProperty({
    enum: ConversionDirectionDto,
    example: ConversionDirectionDto.WT_TO_MOL,
    description: 'wt_to_mol — weight% → mol%;  mol_to_wt — mol% → weight%',
  })
  @IsNotEmpty()
  @IsEnum(ConversionDirectionDto)
  direction: ConversionDirectionDto;
}
