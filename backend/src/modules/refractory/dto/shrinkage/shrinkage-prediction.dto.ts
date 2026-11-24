import { IsNotEmpty, IsNumber, IsArray, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ShrinkagePredictionDto {
  @ApiProperty({ example: [600, 800, 1000, 1200], description: 'Temperature profile in °C' })
  @IsNotEmpty()
  @IsArray()
  @IsNumber({}, { each: true })
  temperatureProfile_C: number[];

  @ApiProperty({ example: 0.35, description: 'Water to cement ratio', required: false })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  waterCementRatio?: number;

  @ApiProperty({ example: 0.1, description: 'Cement content (mass fraction)', required: false })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  cementContent?: number;

  @ApiProperty({ example: 'generic', enum: ['PC', 'CAC', 'generic'], required: false })
  @IsOptional()
  cementType?: 'PC' | 'CAC' | 'generic';

  @ApiProperty({ example: 1, description: 'Hold time at temperature (hours)', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  holdTime_hours?: number;
}

