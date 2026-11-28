import { Injectable, Logger } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { CMS_SEED_PATHS } from '../constants/cms-paths.constants';
import { RETIRED_CMS_PATHS } from '../constants/retired-cms-paths.constants';
import type { PageSeedEntry } from '../types/page-seed-entry.type';
import type { SiteSettingSeedEntry } from '../types/site-setting-seed-entry.type';
import { PageService } from './page.service';
import { SiteSettingsService } from './site-settings.service';

@Injectable()
export class CmsSeedService {
  private readonly logger = new Logger(CmsSeedService.name);

  constructor(
    private readonly pageService: PageService,
    private readonly siteSettingsService: SiteSettingsService,
  ) {}

  async importAll(): Promise<{ pages: number; settings: number }> {
    const pagesPath = this.resolveSeedPath(CMS_SEED_PATHS.PAGES);
    const settingsPath = this.resolveSeedPath(CMS_SEED_PATHS.SITE_SETTINGS);

    const pages = JSON.parse(
      await readFile(pagesPath, 'utf8'),
    ) as PageSeedEntry[];
    const settings = JSON.parse(
      await readFile(settingsPath, 'utf8'),
    ) as SiteSettingSeedEntry[];

    for (const entry of pages) {
      await this.pageService.upsertFromSeed(entry);
    }
    for (const retiredPath of RETIRED_CMS_PATHS) {
      await this.pageService.deleteByPath(retiredPath);
    }
    for (const entry of settings) {
      await this.siteSettingsService.upsertFromSeed(entry.key, entry.value);
    }

    this.logger.log(
      `CMS seed imported: ${pages.length} pages, ${settings.length} settings`,
    );
    return { pages: pages.length, settings: settings.length };
  }

  private resolveSeedPath(relativePath: string): string {
    // Docker compose mounts ./shared at /app/shared (cwd=/app).
    return join(process.cwd(), relativePath);
  }
}
