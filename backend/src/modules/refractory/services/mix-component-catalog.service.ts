import { BadRequestException, Injectable } from '@nestjs/common';
import { MATERIAL_GROUP_ROUTES } from '../constants/material-group-routes.constants';
import { MIX_COMPONENT_GROUPS } from '../constants/mix-component-groups.constants';
import { MIX_EXCLUDED_MATERIAL_IDS } from '../constants/mix-excluded-material-ids.constants';
import { MaterialEntryDto } from '../dto/material-entry.dto';
import { MaterialCategoryDto } from '../dto/material-category.dto';
import { MaterialCatalogService } from './material-catalog.service';

/**
 * MixComponentCatalogService
 *
 * Raw materials allowed in a mix: primary group (`materialGroup[0]`) in
 * `MIX_COMPONENT_GROUPS` and id not in `MIX_EXCLUDED_MATERIAL_IDS`.
 * The primary group is used because glasses carry silicate / oxide as
 * secondary groups and must not enter mixes.
 */
@Injectable()
export class MixComponentCatalogService {
  constructor(private readonly materialCatalog: MaterialCatalogService) {}

  listGroups(): MaterialCategoryDto[] {
    const categories = this.materialCatalog.listCategories();
    return MIX_COMPONENT_GROUPS
      .map(group => ({
        group,
        label: MATERIAL_GROUP_ROUTES.find(r => r.group === group)?.label ?? group,
        materials: (categories.find(c => c.group === group)?.materials ?? [])
          .filter(m => !MIX_EXCLUDED_MATERIAL_IDS.includes(m.materialId)),
      }))
      .filter(category => category.materials.length > 0);
  }

  /** Library entry of a mix component; 404 if unknown, 400 if not allowed in a mix. */
  getMixComponent(materialId: string): MaterialEntryDto {
    const material = this.materialCatalog.getMaterial(materialId);
    if (MIX_EXCLUDED_MATERIAL_IDS.includes(materialId)) {
      throw new BadRequestException(`Material ${materialId} is excluded from mixes`);
    }
    if (!MIX_COMPONENT_GROUPS.includes(material.materialGroup[0])) {
      throw new BadRequestException(
        `Material ${materialId} is not a mix component (primary group: ${material.materialGroup[0]})`,
      );
    }
    return material;
  }
}
