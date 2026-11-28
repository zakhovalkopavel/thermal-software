import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreatePageDto } from '../dto/create-page.dto';
import { PageResponseDto } from '../dto/page-response.dto';
import { UpdatePageDto } from '../dto/update-page.dto';
import { PageService } from '../services/page.service';

@ApiTags('admin-pages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/pages')
export class PagesAdminController {
  constructor(private readonly pageService: PageService) {}

  @Get()
  @ApiOperation({ summary: 'List all pages' })
  @ApiOkResponse({ type: [PageResponseDto] })
  list(): Promise<PageResponseDto[]> {
    return this.pageService.listAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create a page' })
  @ApiOkResponse({ type: PageResponseDto })
  create(@Body() dto: CreatePageDto): Promise<PageResponseDto> {
    return this.pageService.create(dto);
  }

  @Patch()
  @ApiOperation({ summary: 'Update a page by path query' })
  @ApiOkResponse({ type: PageResponseDto })
  update(
    @Query('path') path: string,
    @Body() dto: UpdatePageDto,
  ): Promise<PageResponseDto> {
    return this.pageService.update(path || '/', dto);
  }
}
