import { ApiProperty } from '@nestjs/swagger';

export class BodyGeometryResultDto {
  @ApiProperty() surface: number;
  @ApiProperty() volume: number;
  @ApiProperty() meanBeamLength: number;
  @ApiProperty() characteristicLength: number;
}

