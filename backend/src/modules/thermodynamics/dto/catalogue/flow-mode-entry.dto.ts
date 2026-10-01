import { ApiProperty } from '@nestjs/swagger';
import { FlowRegime } from '../../types/flow-regime.type';

export class FlowModeEntryDto {
  @ApiProperty({ enum: FlowRegime, description: 'Flow regime key' }) key: FlowRegime;
  @ApiProperty({ description: 'Regime description with its Re range', example: 'Re < 2300 — viscous, ordered flow' }) description: string;
}
