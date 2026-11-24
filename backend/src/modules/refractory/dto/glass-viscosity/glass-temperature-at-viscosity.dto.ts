import {
  IsNotEmpty, IsNumber, IsObject, IsOptional, IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { GlassViscosityModelDto } from '../../enums/glass-viscosity-model-dto.enum';

/** Temperature at a target viscosity. */
export class GlassTemperatureAtViscosityDto {
  @ApiProperty({
    description: 'Oxide composition in **wt%**. Keys: SiO2, Al2O3, Na2O, K2O, Li2O, CaO, MgO, BaO, ZnO, PbO, B2O3, Fe2O3, TiO2, ZrO2, SrO, F, SO3, MnO, etc.',
    example: { SiO2: 72.2, Na2O: 13.4, CaO: 11.2, MgO: 1.5, Al2O3: 1.3, K2O: 0.4 },
    type: 'object',
    additionalProperties: { type: 'number' },
  })
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

  @ApiProperty({
    enum: GlassViscosityModelDto,
    required: false,
    description:
      'Model to apply. Auto-selected when omitted. ' +
      'If the requested model is out of range for the composition, ' +
      'the best valid model is used and noted in the response.',
  })
  @IsEnum(GlassViscosityModelDto)
  @IsOptional()
  model?: GlassViscosityModelDto;
}
