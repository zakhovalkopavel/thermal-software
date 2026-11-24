import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';

export class MixComponentInputDto {
  @ApiProperty({ description: 'Library material id (see GET /refractory/mix-components)', example: 'alumina_tabular' })
  @IsString()
  @IsNotEmpty()
  materialId: string;

  @ApiProperty({ description: 'Mass fraction 0–1; the fractions are rescaled to Σ = 1', example: 0.35, minimum: 0, maximum: 1 })
  @IsNumber()
  @Min(0)
  @Max(1)
  massFraction: number;
}
