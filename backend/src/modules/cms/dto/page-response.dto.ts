import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PageKind } from '../enums/page-kind.enum';

export class PageResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  path: string;

  @ApiProperty({ enum: PageKind })
  kind: PageKind;

  @ApiProperty()
  title: string;

  @ApiProperty()
  resume: string;

  @ApiPropertyOptional({ nullable: true })
  bodyHtml: string | null;

  @ApiPropertyOptional({ nullable: true })
  seoTitle: string | null;

  @ApiPropertyOptional({ nullable: true })
  seoDescription: string | null;

  @ApiPropertyOptional({ nullable: true })
  seoKeywords: string | null;

  @ApiPropertyOptional({ nullable: true })
  ogImageUrl: string | null;

  @ApiPropertyOptional({ nullable: true })
  canonicalPath: string | null;

  @ApiProperty()
  published: boolean;

  @ApiProperty()
  updatedAt: Date;
}
