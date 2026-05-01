import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber } from 'class-validator';

/** Base input for regression/curve-fitting endpoints: paired x/y data vectors. */
export class XYInputDto {
  @ApiProperty({ description: 'Independent variable values (x-axis).', example: [1, 2, 3, 4, 5] })
  @IsArray() @IsNumber({}, { each: true }) x: number[];

  @ApiProperty({ description: 'Dependent variable values (y-axis), same length as x.', example: [2.1, 4.0, 6.1, 7.9, 10.2] })
  @IsArray() @IsNumber({}, { each: true }) y: number[];
}

