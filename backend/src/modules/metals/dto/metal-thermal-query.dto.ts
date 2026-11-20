import { IsEnum, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MetalLambdaModel } from '../enums/metal-lambda-model.enum';

export class MetalThermalQueryDto {
  @ApiProperty({
    description: 'Metal material identifier (poly grade or synthesized alloy id)',
    example: 'aisi_304',
  })
  @IsString()
  @MinLength(1)
  material: string;

  @ApiProperty({ description: 'Temperature [K]', example: 800, minimum: 1 })
  @Type(() => Number)
  @IsNumber() @Min(1)
  T_K: number;

  @ApiPropertyOptional({
    description:
      'λ model: `table` (default poly/spline) or `kCT56` (Chebyshev F(C,T) '
      + 'carbon-steel alternative; requires alloy composition.C in [0.05, 1.1])',
    enum: MetalLambdaModel,
    default: MetalLambdaModel.TABLE,
  })
  @IsOptional()
  @IsEnum(MetalLambdaModel)
  lambdaModel?: MetalLambdaModel;
}
