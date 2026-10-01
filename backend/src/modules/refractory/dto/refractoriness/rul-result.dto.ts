import { ApiProperty } from '@nestjs/swagger';

export class RulResultDto {
  @ApiProperty({ description: 'Temperature at 0.5 % deformation [°C]' })
  T05: number;

  @ApiProperty({ description: 'Temperature at 1 % deformation [°C]' })
  T1: number;

  @ApiProperty({ description: 'Temperature at 2 % deformation [°C]' })
  T2: number;

  @ApiProperty()
  testLoad_MPa: number;

  @ApiProperty()
  description: string;
}
