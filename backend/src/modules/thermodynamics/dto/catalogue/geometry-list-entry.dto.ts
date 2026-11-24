import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FlowGeometry } from '../../enums/flow-geometry.enum';

export class GeometryListEntryDto {
  @ApiProperty({ enum: FlowGeometry, description: 'Geometry key' }) key: FlowGeometry;
  @ApiProperty({ description: 'Geometry description', example: 'Circular pipe (internal flow)' }) description: string;
  @ApiProperty({ type: [String], description: 'Dimension fields that must be supplied [m]', example: ['a'] }) requiredDims: string[];
  @ApiPropertyOptional({ type: [String], description: 'Dimension fields that may be supplied [m]', example: ['L'] }) optionalDims?: string[];
}
