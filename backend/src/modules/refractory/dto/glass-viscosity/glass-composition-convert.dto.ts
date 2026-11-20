import { IsNotEmpty, IsObject, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ConversionDirectionDto } from '../../enums/conversion-direction.enum';

/** Oxide composition wt% ↔ mol% conversion request. */
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
