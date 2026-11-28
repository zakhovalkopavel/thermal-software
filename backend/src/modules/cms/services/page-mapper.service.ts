import { Injectable } from '@nestjs/common';
import { Page } from '../entities/page.entity';
import { PageResponseDto } from '../dto/page-response.dto';

@Injectable()
export class PageMapperService {
  toResponse(page: Page): PageResponseDto {
    return {
      id: page.id,
      path: page.path,
      kind: page.kind,
      title: page.title,
      resume: page.resume,
      bodyHtml: page.bodyHtml,
      seoTitle: page.seoTitle,
      seoDescription: page.seoDescription,
      seoKeywords: page.seoKeywords,
      ogImageUrl: page.ogImageUrl,
      canonicalPath: page.canonicalPath,
      published: page.published,
      updatedAt: page.updatedAt,
    };
  }
}
