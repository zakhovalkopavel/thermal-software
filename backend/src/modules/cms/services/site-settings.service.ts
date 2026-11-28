import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SITE_SETTING_KEYS } from '../constants/site-setting-keys.constants';
import { PublicSiteSettingsDto } from '../dto/public-site-settings.dto';
import { UpdateSiteSettingsDto } from '../dto/update-site-settings.dto';
import { SiteSetting } from '../entities/site-setting.entity';
import { HtmlSanitizer } from '../utils/html-sanitizer';

@Injectable()
export class SiteSettingsService {
  constructor(
    @InjectRepository(SiteSetting)
    private readonly settingsRepository: Repository<SiteSetting>,
  ) {}

  async getPublic(): Promise<PublicSiteSettingsDto> {
    return {
      gaMeasurementId: await this.getValue(SITE_SETTING_KEYS.GA_MEASUREMENT_ID),
      siteName:
        (await this.getValue(SITE_SETTING_KEYS.SITE_NAME)) || 'Thermal Software',
    };
  }

  async update(dto: UpdateSiteSettingsDto): Promise<PublicSiteSettingsDto> {
    if (dto.gaMeasurementId !== undefined) {
      await this.setValue(
        SITE_SETTING_KEYS.GA_MEASUREMENT_ID,
        HtmlSanitizer.sanitizePlainText(dto.gaMeasurementId).toUpperCase(),
      );
    }
    if (dto.siteName !== undefined) {
      await this.setValue(
        SITE_SETTING_KEYS.SITE_NAME,
        HtmlSanitizer.sanitizePlainText(dto.siteName) || 'Thermal Software',
      );
    }
    return this.getPublic();
  }

  async upsertFromSeed(key: string, value: string): Promise<void> {
    await this.setValue(key, value);
  }

  private async getValue(key: string): Promise<string> {
    const row = await this.settingsRepository.findOne({ where: { key } });
    return row?.value ?? '';
  }

  private async setValue(key: string, value: string): Promise<void> {
    let row = await this.settingsRepository.findOne({ where: { key } });
    if (!row) {
      row = this.settingsRepository.create({ key, value });
    } else {
      row.value = value;
    }
    await this.settingsRepository.save(row);
  }
}
