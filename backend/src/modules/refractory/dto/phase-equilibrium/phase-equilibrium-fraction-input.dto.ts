import { IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PhaseEquilibriumFractionInputDto {
  @ApiProperty({ example: 'uuid-material-id' })
  @IsNotEmpty() @IsString()
  materialId: string;
  @ApiProperty({ example: 0.5, description: 'Median grain diameter d50 [mm]', exclusiveMinimum: true, minimum: 0 })
  @IsNumber() @Type(() => Number)
  @Min(Number.EPSILON)
  d50_mm: number;
  @ApiProperty({
    example: 0.25,
    minimum: 0,
    maximum: 1,
    description: 'Mass fraction of the mix [-]; values are rescaled to Σ = 1 (need not already sum to 1)',
  })
  @IsNumber() @Type(() => Number)
  @Min(0) @Max(1)
  massFraction: number;
}
