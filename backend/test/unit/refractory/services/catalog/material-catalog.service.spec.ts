import { NotFoundException } from '@nestjs/common';
import { MaterialCatalogService } from '../../../../../src/modules/refractory/services/catalog/material-catalog.service';
import { MATERIAL_GROUP_ROUTES } from '../../../../../src/modules/refractory/constants/material-group-routes.constants';
import { MaterialGroup } from '../../../../../src/modules/refractory/enums/material-group.enum';
import { MaterialGroupRoute } from '../../../../../src/modules/refractory/enums/material-group-route.enum';
import { MaterialType } from '../../../../../src/modules/refractory/enums/material-type.enum';

const UNIQUE_ACTIVE_MATERIALS = 102;
const DUPLICATED_IDS = [
  'ball_clay', 'beta_alumina', 'boric_oxide', 'earthenware_clay', 'ilmenite',
  'porcelain_clay_mix', 'rutile', 'silicon_nitride', 'sodium_aluminate', 'stoneware_clay',
];

describe('MaterialCatalogService', () => {
  let service: MaterialCatalogService;

  beforeEach(() => {
    service = new MaterialCatalogService();
  });

  describe('listMaterials', () => {
    it('no filter - returns 102 unique active materials', () => {
      const materials = service.listMaterials({});
      expect(materials).toHaveLength(UNIQUE_ACTIVE_MATERIALS);
      expect(new Set(materials.map(m => m.materialId)).size).toBe(UNIQUE_ACTIVE_MATERIALS);
    });

    it('ids defined twice in the data files - returned once', () => {
      const ids = service.listMaterials({}).map(m => m.materialId);
      for (const id of DUPLICATED_IDS) {
        expect(ids.filter(x => x === id)).toHaveLength(1);
      }
    });

    it('sorted by orderNumber, then name', () => {
      const materials = service.listMaterials({});
      for (let i = 1; i < materials.length; i++) {
        const prev = materials[i - 1];
        const curr = materials[i];
        const ordered =
          prev.orderNumber < curr.orderNumber ||
          (prev.orderNumber === curr.orderNumber && prev.name.localeCompare(curr.name) <= 0);
        expect(ordered).toBe(true);
      }
    });

    it('does not expose the internal isActive flag', () => {
      expect(service.listMaterials({})[0]).not.toHaveProperty('isActive');
    });

    it('type filter - only materials of that type', () => {
      const clays = service.listMaterials({ type: MaterialType.CLAY });
      expect(clays.length).toBeGreaterThan(0);
      expect(clays.every(m => m.type === MaterialType.CLAY)).toBe(true);
    });

    it('search - case-insensitive substring of id or name', () => {
      const result = service.listMaterials({ search: 'ALUMINA' });
      expect(result.map(m => m.materialId)).toContain('alumina_tabular');
      expect(result.every(m => `${m.materialId} ${m.name}`.toLowerCase().includes('alumina'))).toBe(true);
    });

    it('type and search - combined with AND', () => {
      const result = service.listMaterials({ type: MaterialType.GLASS, search: 'soda' });
      expect(result.length).toBeGreaterThan(0);
      expect(result.every(m => m.type === MaterialType.GLASS)).toBe(true);
      expect(result.map(m => m.materialId)).toContain('soda_lime_glass');
    });
  });

  describe('getMaterial', () => {
    it('known id - returns the entry', () => {
      expect(service.getMaterial('kaolinite').name).toBeDefined();
    });

    it('unknown id - throws NotFoundException', () => {
      expect(() => service.getMaterial('unknown_material')).toThrow(NotFoundException);
    });

    it('refractory product id - not a library material, throws NotFoundException', () => {
      expect(() => service.getMaterial('chamotte_solid')).toThrow(NotFoundException);
    });
  });

  describe('listGroups', () => {
    it('order follows MATERIAL_GROUP_ROUTES and no group is empty', () => {
      const groups = service.listGroups();
      const expectedOrder = MATERIAL_GROUP_ROUTES.map(r => r.route).filter(r => groups.some(g => g.route === r));
      expect(groups.map(g => g.route)).toEqual(expectedOrder);
      expect(groups.every(g => g.count > 0)).toBe(true);
    });

    it('count equals the length of listByGroupRoute', () => {
      for (const group of service.listGroups()) {
        expect(service.listByGroupRoute(group.route)).toHaveLength(group.count);
      }
    });

    it('carbonate group is exposed (dolomite)', () => {
      expect(service.listGroups().map(g => g.group)).toContain(MaterialGroup.CARBONATE);
    });
  });

  describe('listByGroupRoute', () => {
    it('every material contains the mapped group', () => {
      for (const { route, group } of MATERIAL_GROUP_ROUTES) {
        expect(service.listByGroupRoute(route).every(m => m.materialGroup.includes(group))).toBe(true);
      }
    });

    it('a glass with a secondary silicate group appears under glasses and silicates', () => {
      const glassIds = service.listByGroupRoute(MaterialGroupRoute.GLASSES).map(m => m.materialId);
      const silicateIds = service.listByGroupRoute(MaterialGroupRoute.SILICATES).map(m => m.materialId);
      expect(glassIds).toContain('soda_lime_glass');
      expect(silicateIds).toContain('soda_lime_glass');
    });
  });

  describe('listCategories', () => {
    it('every material exactly once, under its primary group', () => {
      const categories = service.listCategories();
      const ids = categories.flatMap(c => c.materials.map(m => m.materialId));
      expect(ids).toHaveLength(UNIQUE_ACTIVE_MATERIALS);
      expect(new Set(ids).size).toBe(UNIQUE_ACTIVE_MATERIALS);
      for (const category of categories) {
        expect(category.materials.every(m => m.materialGroup[0] === category.group)).toBe(true);
      }
    });

    it('soda_lime_glass only under glass', () => {
      const owners = service.listCategories()
        .filter(c => c.materials.some(m => m.materialId === 'soda_lime_glass'))
        .map(c => c.group);
      expect(owners).toEqual([MaterialGroup.GLASS]);
    });

    it('labels and order follow MATERIAL_GROUP_ROUTES; no empty category', () => {
      const categories = service.listCategories();
      const expected = MATERIAL_GROUP_ROUTES.filter(r => categories.some(c => c.group === r.group));
      expect(categories.map(c => [c.group, c.label])).toEqual(expected.map(r => [r.group, r.label]));
      expect(categories.every(c => c.materials.length > 0)).toBe(true);
    });
  });
});
