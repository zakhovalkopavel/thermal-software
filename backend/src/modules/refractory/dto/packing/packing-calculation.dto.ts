import { IsNotEmpty, IsNumber, IsArray, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class PackingCalculationDto {
  @ApiProperty({ example: [0.3, 0.25, 0.2, 0.15, 0.1] })
  @IsNotEmpty() @IsArray() @IsNumber({}, { each: true })
  massFractions: number[];
  @ApiProperty({ example: [2700, 2800, 2650, 2750, 2700] })
  @IsNotEmpty() @IsArray() @IsNumber({}, { each: true })
  densities_kgm3: number[];
  @ApiProperty({ example: [5.0, 1.0, 0.5, 0.1, 0.01] })
  @IsNotEmpty() @IsArray() @IsNumber({}, { each: true })
  diameters_mm: number[];
  @ApiProperty({ example: 10, required: false })
  @IsNumber() @Min(0)
  compactionPressure_MPa?: number;
  @ApiProperty({ example: 'CPM', enum: ['CPM', 'Furnas'] })
  @IsNotEmpty() @IsString()
  packingModel: 'CPM' | 'Furnas';
}
