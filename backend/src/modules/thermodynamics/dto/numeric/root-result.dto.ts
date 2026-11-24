import { ApiProperty } from '@nestjs/swagger';

export class RootResultDto {
  @ApiProperty({ description: 'Root x* with f(x*) ≈ 0', example: 0.739085 }) root: number;
}
