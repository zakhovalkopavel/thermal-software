import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePageDto } from '../dto/create-page.dto';
import { PageResponseDto } from '../dto/page-response.dto';
import { UpdatePageDto } from '../dto/update-page.dto';
import { Page } from '../entities/page.entity';
import { HtmlSanitizer } from '../utils/html-sanitizer';
import { PageMapperService } from './page-mapper.service';

@Injectable()
export class PageService {
  constructor(
    @InjectRepository(Page)
    private readonly pageRepository: Repository<Page>,
    private readonly pageMapper: PageMapperService,
  ) {}

  async findPublishedByPath(path: string): Promise<PageResponseDto> {
    const page = await this.pageRepository.findOne({
      where: { path: this.normalizePath(path), published: true },
    });
    if (!page) {
      throw new NotFoundException(`Page not found: ${path}`);
    }
    return this.pageMapper.toResponse(page);
  }

  async findEntityByPath(path: string): Promise<Page | null> {
    return this.pageRepository.findOne({
      where: { path: this.normalizePath(path) },
    });
  }

  async listAll(): Promise<PageResponseDto[]> {
    const pages = await this.pageRepository.find({
      order: { path: 'ASC' },
    });
    return pages.map((page) => this.pageMapper.toResponse(page));
  }

  async listPublishedByPrefix(prefix: string): Promise<PageResponseDto[]> {
    const normalized = this.normalizePath(prefix);
    const pages = await this.pageRepository
      .createQueryBuilder('page')
      .where('page.published = :published', { published: true })
      .andWhere('(page.path = :exact OR page.path LIKE :prefix)', {
        exact: normalized,
        prefix: `${normalized === '/' ? '' : normalized}/%`,
      })
      .orderBy('page.path', 'ASC')
      .getMany();
    return pages.map((page) => this.pageMapper.toResponse(page));
  }

  async create(dto: CreatePageDto): Promise<PageResponseDto> {
    const path = this.normalizePath(dto.path);
    const existing = await this.pageRepository.findOne({ where: { path } });
    if (existing) {
      throw new ConflictException(`Page already exists: ${path}`);
    }
    const page = this.pageRepository.create({
      path,
      kind: dto.kind,
      title: HtmlSanitizer.sanitizePlainText(dto.title),
      resume: HtmlSanitizer.sanitizePlainText(dto.resume ?? ''),
      bodyHtml: HtmlSanitizer.sanitizeBody(dto.bodyHtml),
      seoTitle: this.nullablePlain(dto.seoTitle),
      seoDescription: this.nullablePlain(dto.seoDescription),
      seoKeywords: this.nullablePlain(dto.seoKeywords),
      ogImageUrl: this.nullablePlain(dto.ogImageUrl),
      canonicalPath: this.nullablePlain(dto.canonicalPath),
      published: dto.published ?? true,
    });
    const saved = await this.pageRepository.save(page);
    return this.pageMapper.toResponse(saved);
  }

  async update(path: string, dto: UpdatePageDto): Promise<PageResponseDto> {
    const page = await this.pageRepository.findOne({
      where: { path: this.normalizePath(path) },
    });
    if (!page) {
      throw new NotFoundException(`Page not found: ${path}`);
    }
    if (dto.kind !== undefined) {
      page.kind = dto.kind;
    }
    if (dto.title !== undefined) {
      page.title = HtmlSanitizer.sanitizePlainText(dto.title);
    }
    if (dto.resume !== undefined) {
      page.resume = HtmlSanitizer.sanitizePlainText(dto.resume);
    }
    if (dto.bodyHtml !== undefined) {
      page.bodyHtml = HtmlSanitizer.sanitizeBody(dto.bodyHtml);
    }
    if (dto.seoTitle !== undefined) {
      page.seoTitle = this.nullablePlain(dto.seoTitle);
    }
    if (dto.seoDescription !== undefined) {
      page.seoDescription = this.nullablePlain(dto.seoDescription);
    }
    if (dto.seoKeywords !== undefined) {
      page.seoKeywords = this.nullablePlain(dto.seoKeywords);
    }
    if (dto.ogImageUrl !== undefined) {
      page.ogImageUrl = this.nullablePlain(dto.ogImageUrl);
    }
    if (dto.canonicalPath !== undefined) {
      page.canonicalPath = this.nullablePlain(dto.canonicalPath);
    }
    if (dto.published !== undefined) {
      page.published = dto.published;
    }
    const saved = await this.pageRepository.save(page);
    return this.pageMapper.toResponse(saved);
  }

  async deleteByPath(path: string): Promise<void> {
    await this.pageRepository.delete({ path: this.normalizePath(path) });
  }

  async upsertFromSeed(entry: {
    path: string;
    kind: Page['kind'];
    title: string;
    resume: string;
    bodyHtml?: string | null;
    seoTitle?: string | null;
    seoDescription?: string | null;
    seoKeywords?: string | null;
    ogImageUrl?: string | null;
    canonicalPath?: string | null;
    published?: boolean;
  }): Promise<void> {
    const path = this.normalizePath(entry.path);
    let page = await this.pageRepository.findOne({ where: { path } });
    if (!page) {
      page = this.pageRepository.create({ path });
    }
    page.kind = entry.kind;
    page.title = entry.title;
    page.resume = entry.resume ?? '';
    page.bodyHtml = entry.bodyHtml ?? null;
    page.seoTitle = entry.seoTitle ?? null;
    page.seoDescription = entry.seoDescription ?? null;
    page.seoKeywords = entry.seoKeywords ?? null;
    page.ogImageUrl = entry.ogImageUrl ?? null;
    page.canonicalPath = entry.canonicalPath ?? null;
    page.published = entry.published ?? true;
    await this.pageRepository.save(page);
  }

  private normalizePath(path: string): string {
    if (!path || path === '/') {
      return '/';
    }
    const withSlash = path.startsWith('/') ? path : `/${path}`;
    return withSlash.replace(/\/+$/, '') || '/';
  }

  private nullablePlain(value: string | null | undefined): string | null {
    if (value == null) {
      return null;
    }
    const cleaned = HtmlSanitizer.sanitizePlainText(value);
    return cleaned === '' ? null : cleaned;
  }
}
