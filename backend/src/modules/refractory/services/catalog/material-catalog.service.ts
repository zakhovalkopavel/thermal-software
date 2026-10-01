import { Injectable, NotFoundException } from '@nestjs/common';
import { ALL_MATERIALS } from '../../data/materials-index';
import { MaterialEntry } from '../../data/interfaces/material.interface';
import { MATERIAL_GROUP_ROUTES } from '../../constants/material-group-routes.constants';
import { MaterialGroup } from '../../enums/material-group.enum';
import { MaterialGroupRoute } from '../../enums/material-group-route.enum';
import { MaterialType } from '../../enums/material-type.enum';
import { MaterialListQueryDto } from '../../dto/material-catalog/material-list-query.dto';
import { MaterialEntryDto } from '../../dto/material-catalog/material-entry.dto';
import { MaterialGroupSummaryDto } from '../../dto/material-catalog/material-group-summary.dto';
import { MaterialCategoryDto } from '../../dto/material-catalog/material-category.dto';

/**
 * MaterialCatalogService
 *
 * Read-only access to the raw-material library (`ALL_MATERIALS`).
 * The library contains a few ids defined twice with identical data; the
 * catalogue keeps the first occurrence, drops inactive entries and sorts by
 * `orderNumber`, then `name`. Built once at construction.
 */
@Injectable()
export class MaterialCatalogService {
  private readonly materials: MaterialEntryDto[];
  private readonly materialsById: Map<string, MaterialEntryDto>;

  constructor() {
    const unique = new Map<string, MaterialEntry>();
    for (const entry of ALL_MATERIALS) {
      if (entry.isActive && !unique.has(entry.materialId)) {
        unique.set(entry.materialId, entry);
      }
    }
    this.materials = [...unique.values()]
      .map(entry => this.toDto(entry))
      .sort((a, b) => a.orderNumber - b.orderNumber || a.name.localeCompare(b.name));
    this.materialsById = new Map(this.materials.map(m => [m.materialId, m]));
  }

  listMaterials(query: MaterialListQueryDto): MaterialEntryDto[] {
    const search = query.search?.trim().toLowerCase();
    return this.materials.filter(m =>
      (!query.type || m.type === query.type) &&
      (!search || m.materialId.toLowerCase().includes(search) || m.name.toLowerCase().includes(search)),
    );
  }

  getMaterial(materialId: string): MaterialEntryDto {
    const material = this.materialsById.get(materialId);
    if (!material) throw new NotFoundException(`Unknown material: ${materialId}`);
    return material;
  }

  listGroups(): MaterialGroupSummaryDto[] {
    return MATERIAL_GROUP_ROUTES
      .map(({ route, group, label }) => ({ group, route, label, count: this.byGroup(group).length }))
      .filter(summary => summary.count > 0);
  }

  listByGroupRoute(route: MaterialGroupRoute): MaterialEntryDto[] {
    const mapping = MATERIAL_GROUP_ROUTES.find(r => r.route === route);
    return mapping ? this.byGroup(mapping.group) : [];
  }

  /** Every material once, under its primary group (`materialGroup[0]`). */
  listCategories(): MaterialCategoryDto[] {
    return MATERIAL_GROUP_ROUTES
      .map(({ group, label }) => ({
        group,
        label,
        materials: this.materials.filter(m => m.materialGroup[0] === group),
      }))
      .filter(category => category.materials.length > 0);
  }

  private byGroup(group: MaterialGroup): MaterialEntryDto[] {
    return this.materials.filter(m => m.materialGroup.includes(group));
  }

  private toDto(entry: MaterialEntry): MaterialEntryDto {
    const { isActive: _isActive, ...fields } = entry;
    return {
      ...fields,
      type: fields.type as MaterialType,
      materialGroup: fields.materialGroup as MaterialGroup[],
    };
  }
}
