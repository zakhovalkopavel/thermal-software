import { ApiProperty } from '@nestjs/swagger';
import { ConfidenceLevel } from '../../../enums/confidence-level.enum';
import { ExtrapolationRisk } from '../../../enums/extrapolation-risk.enum';
import { CompositionIssueDto } from './composition-issue.dto';

export class ViscosityValidationStatusDto {
  @ApiProperty()
  systemDetected: string;

  @ApiProperty({ enum: ConfidenceLevel })
  confidenceLevel: ConfidenceLevel;

  @ApiProperty({ type: [String] })
  warnings: string[];

  @ApiProperty()
  componentsInRange: number;

  @ApiProperty()
  componentsOutOfRange: number;

  @ApiProperty({ enum: ExtrapolationRisk })
  extrapolationRisk: ExtrapolationRisk;

  @ApiProperty({ type: [CompositionIssueDto], required: false })
  compositionIssues?: CompositionIssueDto[];
}
