import { ApiProperty } from '@nestjs/swagger';

export class Minimum1dResultDto {
  @ApiProperty({ type: [Number], description: 'Minimiser x* as a one-element array', example: [1.5] }) x: number[];
  @ApiProperty({ description: 'Function value f(x*) at the minimum', example: 0 }) fx: number;
}
