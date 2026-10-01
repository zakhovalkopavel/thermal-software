import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { MixComponentInputDto } from './mix-component-input.dto';

export class MixCompositionInputDto {
  @ApiProperty({
    type: [MixComponentInputDto],
    example: [
      { materialId: 'alumina_tabular', massFraction: 0.7 },
      { materialId: 'kaolinite', massFraction: 0.3 },
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => MixComponentInputDto)
  fractions: MixComponentInputDto[];
}
