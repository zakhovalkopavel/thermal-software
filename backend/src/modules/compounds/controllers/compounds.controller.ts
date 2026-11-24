import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CompoundBoundsService } from '../services/compound-bounds.service';
import { CompoundSearchService } from '../services/compound-search.service';
import { CompoundGasBoundsDto } from '../dto/compound-gas-bounds.dto';
import { CompoundGasBoundsQueryDto } from '../dto/compound-gas-bounds-query.dto';
import { CompoundIdParamDto } from '../dto/compound-id-param.dto';
import { CompoundSearchHitDto } from '../dto/compound-search-hit.dto';
import { CompoundSearchQueryDto } from '../dto/compound-search-query.dto';

@ApiTags('compounds')
@Controller('compounds')
export class CompoundsController {
  constructor(
    private readonly searchService: CompoundSearchService,
    private readonly boundsService: CompoundBoundsService,
  ) {}

  @Get('search')
  @ApiOperation({ summary: 'Search compounds by name, synonym, CAS, or formula' })
  @ApiOkResponse({ type: [CompoundSearchHitDto] })
  search(@Query() query: CompoundSearchQueryDto): CompoundSearchHitDto[] {
    return this.searchService.search(query.q, query.limit, query.gasesOnly);
  }

  @Get(':id/gas-bounds')
  @ApiOperation({
    summary: 'Gas-phase temperature bounds for a compound at pressure P (Tmin = Tb(P))',
  })
  @ApiOkResponse({ type: CompoundGasBoundsDto })
  gasBounds(
    @Param() params: CompoundIdParamDto,
    @Query() query: CompoundGasBoundsQueryDto,
  ): CompoundGasBoundsDto {
    return this.boundsService.gasBounds(params.id, query.P_Pa);
  }
}
