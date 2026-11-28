import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { PageService } from '../../cms/services/page.service';
import { SiteSettingsService } from '../../cms/services/site-settings.service';
import { SSR_CONSTANTS } from '../constants/ssr.constants';
import { SsrHtmlDocument } from '../utils/ssr-html-document';

@Injectable()
export class SsrShellService {
  constructor(
    private readonly pageService: PageService,
    private readonly siteSettingsService: SiteSettingsService,
    private readonly config: ConfigService,
  ) {}

  async renderForPath(rawPath: string): Promise<string> {
    const path = this.normalizePath(rawPath);
    const settings = await this.siteSettingsService.getPublic();
    const page = await this.pageService.findEntityByPath(path);
    const title =
      page?.seoTitle ||
      page?.title ||
      settings.siteName ||
      SSR_CONSTANTS.DEFAULT_TITLE;
    const description =
      page?.seoDescription || page?.resume || SSR_CONSTANTS.DEFAULT_DESCRIPTION;
    const bootstrap = {
      path,
      page: page
        ? {
            path: page.path,
            kind: page.kind,
            title: page.title,
            resume: page.resume,
            bodyHtml: page.published ? page.bodyHtml : null,
            seoTitle: page.seoTitle,
            seoDescription: page.seoDescription,
            published: page.published,
          }
        : null,
      settings,
    };
    const assetMode = this.resolveAssetMode();
    const staticAssets =
      assetMode === 'static' ? await this.loadStaticAssets() : {};

    return SsrHtmlDocument.render({
      path,
      title,
      description,
      keywords: page?.seoKeywords,
      ogImageUrl: page?.ogImageUrl,
      canonicalPath: page?.canonicalPath || path,
      bodyHtml: page?.published ? page.bodyHtml : null,
      gaMeasurementId: settings.gaMeasurementId,
      siteName: settings.siteName,
      bootstrapJson: JSON.stringify(bootstrap).replace(/</g, '\\u003c'),
      assetMode,
      staticScripts: staticAssets.scripts,
      staticStyles: staticAssets.styles,
    });
  }

  private normalizePath(path: string): string {
    if (!path || path === '/') {
      return '/';
    }
    const withSlash = path.startsWith('/') ? path : `/${path}`;
    return withSlash.replace(/\/+$/, '') || '/';
  }

  private resolveAssetMode(): 'vite-dev' | 'static' {
    const forced = this.config.get<string>('SSR_ASSET_MODE');
    if (forced === 'static' || forced === 'vite-dev') {
      return forced;
    }
    return this.config.get<string>('NODE_ENV') === 'production'
      ? 'static'
      : 'vite-dev';
  }

  private async loadStaticAssets(): Promise<{
    scripts?: string[];
    styles?: string[];
  }> {
    const manifestCandidates = [
      join(process.cwd(), 'frontend-dist', '.vite', 'manifest.json'),
      join(process.cwd(), '..', 'frontend', 'dist', '.vite', 'manifest.json'),
      '/app/frontend-dist/.vite/manifest.json',
    ];
    for (const candidate of manifestCandidates) {
      try {
        const raw = await readFile(candidate, 'utf8');
        const manifest = JSON.parse(raw) as Record<
          string,
          { file: string; css?: string[]; isEntry?: boolean }
        >;
        const entry =
          manifest['index.html'] ||
          Object.values(manifest).find((item) => item.isEntry);
        if (!entry) {
          continue;
        }
        return {
          scripts: [`/${entry.file}`],
          styles: (entry.css ?? []).map((href) => `/${href}`),
        };
      } catch {
        // try next
      }
    }
    return {
      scripts: ['/assets/index.js'],
      styles: [],
    };
  }
}
