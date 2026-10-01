import { ApiProperty } from '@nestjs/swagger';

export class AlphaResultDto {
  @ApiProperty() total_Wm2K: number;
  @ApiProperty() convection_Wm2K: number;
  @ApiProperty() radiation_Wm2K: number;
}
