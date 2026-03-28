import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CorrelationName } from '../types/correlation-name.type';
import { FlowRegime } from '../types/flow-regime.type';

export class DimensionlessResultDto {
  @ApiPropertyOptional() Re?: number;
  @ApiPropertyOptional() Pr?: number;
  @ApiPropertyOptional() Gr?: number;
  @ApiPropertyOptional() Ra?: number;
  @ApiProperty() Nu: number;
  @ApiPropertyOptional() h_W_m2K?: number;
  @ApiProperty() correlation: CorrelationName;
  @ApiProperty({ enum: FlowRegime }) regime: FlowRegime;
  @ApiProperty() isNatural: boolean;
  @ApiPropertyOptional() preferredRequested?: CorrelationName;
  @ApiProperty() preferredUsed: boolean;
  @ApiPropertyOptional() preferredRejectedReason?: string;
  @ApiPropertyOptional() warning?: string;
  @ApiProperty() rangeValid: boolean;
  @ApiPropertyOptional() allCorrelations?: Record<string, { Nu: number; rangeValid: boolean; warning?: string }>;
}

