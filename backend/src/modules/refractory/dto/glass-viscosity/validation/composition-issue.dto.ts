import { ApiProperty } from '@nestjs/swagger';
import { CompositionValidRangeDto } from './composition-valid-range.dto';

const ISSUE_SEVERITIES = ['WARNING', 'ERROR'];

export class CompositionIssueDto {
  @ApiProperty()
  component: string;

  @ApiProperty()
  actualValue: number;

  @ApiProperty({ type: CompositionValidRangeDto })
  validRange: CompositionValidRangeDto;

  @ApiProperty({ enum: ISSUE_SEVERITIES })
  severity: string;

  @ApiProperty()
  impact: string;
}
