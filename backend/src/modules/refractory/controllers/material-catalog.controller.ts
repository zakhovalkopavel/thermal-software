import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiExtraModels,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { RefractoryThermalService } from '../services/catalog/refractory-thermal.service';
import { MaterialCatalogService } from '../services/catalog/material-catalog.service';
import { ParticleSizeCatalogService } from '../services/catalog/particle-size-catalog.service';
import { MixComponentCatalogService } from '../services/catalog/mix-component-catalog.service';
import { RefractoryProductSummaryDto } from '../dto/refractory-products/refractory-product-summary.dto';
import { RefractoryProductQueryDto } from '../dto/refractory-products/refractory-product-query.dto';
import { RefractoryProductResultDto } from '../dto/refractory-products/refractory-product-result.dto';
import { MaterialListQueryDto } from '../dto/material-catalog/material-list-query.dto';
import { MaterialIdParamDto } from '../dto/material-catalog/material-id-param.dto';
import { MaterialGroupRouteParamDto } from '../dto/material-catalog/material-group-route-param.dto';
import { MaterialEntryDto } from '../dto/material-catalog/material-entry.dto';
import { MaterialGroupSummaryDto } from '../dto/material-catalog/material-group-summary.dto';
import { MaterialCategoryDto } from '../dto/material-catalog/material-category.dto';
import { ParticleSizesDto } from '../dto/material-catalog/particle-sizes.dto';
import { ParticleSizeRangeDto } from '../dto/material-catalog/particle-size-range.dto';

/**
 * Read-only catalogue of materials already present in the refractory library.
 *
 * `GET /refractory/:groupRoute` is a parameter route directly under
 * `/refractory`: it must stay the LAST handler here, and this controller must be
 * registered after `RefractoryController`. Declare any new static GET route above it.
 */
@ApiTags('materials')
@ApiExtraModels(ParticleSizeRangeDto)
@Controller('refractory')
export class MaterialCatalogController {
  constructor(
    private readonly refractoryThermalService: RefractoryThermalService,
    private readonly materialCatalogService: MaterialCatalogService,
    private readonly particleSizeCatalogService: ParticleSizeCatalogService,
    private readonly mixComponentCatalogService: MixComponentCatalogService,
  ) {}

  @Get('refractories')
  @ApiOperation({ summary: 'Known refractory and insulation products (19)' })
  @ApiOkResponse({ type: [RefractoryProductSummaryDto] })
  listRefractoryProducts(): RefractoryProductSummaryDto[] {
    return this.refractoryThermalService.listProducts();
  }

  @Get('refractories/properties')
  @ApiOperation({ summary: 'λ and ε of a refractory product at T_K (ε clamped to its validity range)' })
  @ApiOkResponse({ type: RefractoryProductResultDto })
  @ApiBadRequestResponse({ description: 'Unknown material or invalid T_K' })
  getRefractoryProductProperties(@Query() query: RefractoryProductQueryDto): RefractoryProductResultDto {
    return this.refractoryThermalService.getProperties(query);
  }

  @Get('materials')
  @ApiOperation({ summary: 'Raw-material library, optionally filtered by type and search text' })
  @ApiOkResponse({ type: [MaterialEntryDto] })
  @ApiBadRequestResponse({ description: 'Invalid or unknown query parameter' })
  listMaterials(@Query() query: MaterialListQueryDto): MaterialEntryDto[] {
    return this.materialCatalogService.listMaterials(query);
  }

  @Get('materials/:materialId')
  @ApiOperation({ summary: 'One raw material by id' })
  @ApiOkResponse({ type: MaterialEntryDto })
  @ApiNotFoundResponse({ description: 'Unknown material id' })
  getMaterial(@Param() params: MaterialIdParamDto): MaterialEntryDto {
    return this.materialCatalogService.getMaterial(params.materialId);
  }

  @Get('material-groups')
  @ApiOperation({ summary: 'Library groups with their route and material count' })
  @ApiOkResponse({ type: [MaterialGroupSummaryDto] })
  listMaterialGroups(): MaterialGroupSummaryDto[] {
    return this.materialCatalogService.listGroups();
  }

  @Get('particle-sizes')
  @ApiOperation({ summary: 'Standard particle-size tables' })
  @ApiOkResponse({ type: ParticleSizesDto })
  getParticleSizes(): ParticleSizesDto {
    return this.particleSizeCatalogService.getParticleSizes();
  }

  @Get('mix-components')
  @ApiOperation({ summary: 'Raw materials allowed in mixes, grouped by primary group' })
  @ApiOkResponse({ type: [MaterialCategoryDto] })
  listMixComponents(): MaterialCategoryDto[] {
    return this.mixComponentCatalogService.listGroups();
  }

  @Get('material-categories')
  @ApiOperation({ summary: 'All library materials, each once, grouped by primary group' })
  @ApiOkResponse({ type: [MaterialCategoryDto] })
  listMaterialCategories(): MaterialCategoryDto[] {
    return this.materialCatalogService.listCategories();
  }

  @Get(':groupRoute')
  @ApiOperation({ summary: 'Materials of one library group (a material with several groups appears in each)' })
  @ApiOkResponse({ type: [MaterialEntryDto] })
  @ApiBadRequestResponse({ description: 'Unknown group route' })
  listByGroupRoute(@Param() params: MaterialGroupRouteParamDto): MaterialEntryDto[] {
    return this.materialCatalogService.listByGroupRoute(params.groupRoute);
  }
}
