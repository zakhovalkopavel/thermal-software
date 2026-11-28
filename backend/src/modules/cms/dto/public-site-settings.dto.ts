import { ApiPropertyOptional } from '@nestjs/swagger';

export class PublicSiteSettingsDto {
  @ApiPropertyOptional({ description: 'Google Analytics Measurement ID (G-XXXXXXXX)' })
  gaMeasurementId: string;

  @ApiPropertyOptional()
  siteName: string;
}
