import { ApiProperty } from '@nestjs/swagger';

export class HealthStatusDto {
  @ApiProperty({ example: 'ok' }) status: string;
  @ApiProperty({ format: 'date-time' }) timestamp: string;
}
