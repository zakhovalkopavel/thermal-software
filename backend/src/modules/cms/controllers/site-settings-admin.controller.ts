import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PublicSiteSettingsDto } from '../dto/public-site-settings.dto';
import { UpdateSiteSettingsDto } from '../dto/update-site-settings.dto';
import { SiteSettingsService } from '../services/site-settings.service';

@ApiTags('admin-site-settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/site-settings')
export class SiteSettingsAdminController {
  constructor(private readonly siteSettingsService: SiteSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get site settings' })
  @ApiOkResponse({ type: PublicSiteSettingsDto })
  get(): Promise<PublicSiteSettingsDto> {
    return this.siteSettingsService.getPublic();
  }

  @Patch()
  @ApiOperation({ summary: 'Update site settings' })
  @ApiOkResponse({ type: PublicSiteSettingsDto })
  update(@Body() dto: UpdateSiteSettingsDto): Promise<PublicSiteSettingsDto> {
    return this.siteSettingsService.update(dto);
  }
}
