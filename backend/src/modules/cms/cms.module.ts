import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { PagesAdminController } from './controllers/pages-admin.controller';
import { PagesPublicController } from './controllers/pages-public.controller';
import { SiteSettingsAdminController } from './controllers/site-settings-admin.controller';
import { SiteSettingsPublicController } from './controllers/site-settings-public.controller';
import { AdminUser } from './entities/admin-user.entity';
import { Page } from './entities/page.entity';
import { SiteSetting } from './entities/site-setting.entity';
import { CmsSeedService } from './services/cms-seed.service';
import { PageMapperService } from './services/page-mapper.service';
import { PageService } from './services/page.service';
import { SiteSettingsService } from './services/site-settings.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Page, SiteSetting, AdminUser]),
    AuthModule,
  ],
  controllers: [
    PagesPublicController,
    PagesAdminController,
    SiteSettingsPublicController,
    SiteSettingsAdminController,
  ],
  providers: [
    PageService,
    PageMapperService,
    SiteSettingsService,
    CmsSeedService,
  ],
  exports: [PageService, SiteSettingsService, CmsSeedService, TypeOrmModule],
})
export class CmsModule {}
