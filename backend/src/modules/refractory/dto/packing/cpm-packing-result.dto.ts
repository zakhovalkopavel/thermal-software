import { ApiProperty } from '@nestjs/swagger';
import { CpmCalibrationResultDto } from './cpm-calibration-result.dto';
import { CpmCompositionAnalysisDto } from './cpm-composition-analysis.dto';
import { PackingResultDto } from './packing-result.dto';

export class CpmPackingResultDto extends PackingResultDto {
  @ApiProperty({ type: CpmCalibrationResultDto })
  calibration: CpmCalibrationResultDto;

  @ApiProperty({ type: CpmCompositionAnalysisDto })
  composition: CpmCompositionAnalysisDto;
}
