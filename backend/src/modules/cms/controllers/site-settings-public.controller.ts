import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PublicSiteSettingsDto } from '../dto/public-site-settings.dto';
import { SiteSettingsService } from '../services/site-settings.service';

@ApiTags('site-settings')
@Controller('site-settings')
export class SiteSettingsPublicController {
  constructor(private readonly siteSettingsService: SiteSettingsService) {}

  @Get('public')
  @ApiOperation({ summary: 'Public site settings (GA id, site name)' })
  @ApiOkResponse({ type: PublicSiteSettingsDto })
  getPublic(): Promise<PublicSiteSettingsDto> {
    return this.siteSettingsService.getPublic();
  }
}
