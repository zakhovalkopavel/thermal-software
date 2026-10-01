import { ApiProperty } from '@nestjs/swagger';

export class CpmCompositionAnalysisDto {
  @ApiProperty()
  hasMicroFillers: boolean;

  @ApiProperty()
  microFillerPercent: number;

  @ApiProperty()
  psdType: string;

  @ApiProperty()
  packingQuality: string;

  @ApiProperty()
  recommendedMaxPhi: number;

  @ApiProperty()
  explanation: string;
}
