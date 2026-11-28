import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class UpdateSiteSettingsDto {
  @ApiPropertyOptional({ example: 'G-XXXXXXXX' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  @Matches(/^(G-[A-Z0-9]+)?$/, {
    message: 'gaMeasurementId must be empty or look like G-XXXXXXXX',
  })
  gaMeasurementId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  siteName?: string;
}
