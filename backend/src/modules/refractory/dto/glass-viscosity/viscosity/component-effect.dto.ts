import { ApiProperty } from '@nestjs/swagger';

export class ComponentEffectDto {
  @ApiProperty({ example: 'SiO2' })
  component: string;

  @ApiProperty()
  percentage: number;

  @ApiProperty()
  effect: number;
}
