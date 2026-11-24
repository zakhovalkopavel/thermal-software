import { IsNotEmpty, IsArray, IsObject, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { FractionInputDto } from '../common/fraction-input.dto';
import { BlendOptimizationOptionsDto } from './blend-optimization-options.dto';

export class BlendOptimizationDto {
  @ApiProperty({ type: [FractionInputDto] })
  @IsNotEmpty() @IsArray() @ValidateNested({ each: true })
  @Type(() => FractionInputDto)
  fractions: FractionInputDto[];
  @ApiProperty({ type: BlendOptimizationOptionsDto, required: false })
  @IsObject() @ValidateNested() @Type(() => BlendOptimizationOptionsDto) @IsOptional()
  options?: BlendOptimizationOptionsDto;
}
