import { ApiProperty } from '@nestjs/swagger';

export class CpmCalibrationResultDto {
  @ApiProperty({ description: 'Virtual packing limit β₀' })
  beta0: number;

  @ApiProperty({ description: 'Compaction constant' })
  K: number;

  @ApiProperty()
  maxPhi: number;

  @ApiProperty()
  denomFloor: number;

  @ApiProperty()
  compactionIndex: number;

  @ApiProperty()
  autoDetected: boolean;
}
