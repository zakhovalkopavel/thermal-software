import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { PageKind } from '../enums/page-kind.enum';

export class CreatePageDto {
  @ApiProperty({ example: '/about' })
  @IsString()
  @MaxLength(512)
  @Matches(/^\/[A-Za-z0-9\-/_]*$/, {
    message: 'path must start with / and contain only URL-safe characters',
  })
  path: string;

  @ApiProperty({ enum: PageKind })
  @IsEnum(PageKind)
  kind: PageKind;

  @ApiProperty()
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resume?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  bodyHtml?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  seoTitle?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  seoDescription?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  seoKeywords?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  ogImageUrl?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  canonicalPath?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  published?: boolean;
}
