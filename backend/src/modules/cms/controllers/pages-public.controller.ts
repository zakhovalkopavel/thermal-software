import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PageResponseDto } from '../dto/page-response.dto';
import { PageService } from '../services/page.service';

@ApiTags('pages')
@Controller('pages')
export class PagesPublicController {
  constructor(private readonly pageService: PageService) {}

  @Get()
  @ApiOperation({ summary: 'Get a published page by path' })
  @ApiOkResponse({ type: PageResponseDto })
  getByPath(@Query('path') path: string): Promise<PageResponseDto> {
    return this.pageService.findPublishedByPath(path || '/');
  }

  @Get('list')
  @ApiOperation({ summary: 'List published pages under a path prefix' })
  @ApiOkResponse({ type: [PageResponseDto] })
  listPrefix(@Query('prefix') prefix: string): Promise<PageResponseDto[]> {
    return this.pageService.listPublishedByPrefix(prefix || '/');
  }
}
