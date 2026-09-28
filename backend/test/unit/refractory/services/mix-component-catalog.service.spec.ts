import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MaterialCatalogService } from '../../../../src/modules/refractory/services/material-catalog.service';
import { MixComponentCatalogService } from '../../../../src/modules/refractory/services/mix-component-catalog.service';
import { MIX_COMPONENT_GROUPS } from '../../../../src/modules/refractory/constants/mix-component-groups.constants';
import { MaterialGroup } from '../../../../src/modules/refractory/enums/material-group.enum';

const EXPECTED_COUNTS: Record<string, number> = {
  [MaterialGroup.BINDER]: 4,
  [MaterialGroup.OXIDE]: 21,
  [MaterialGroup.SILICATE]: 14,
  [MaterialGroup.CLAY]: 10,
  [MaterialGroup.CARBIDE]: 5,
  [MaterialGroup.NITRIDE]: 6,
};

describe('MixComponentCatalogService', () => {
  let service: MixComponentCatalogService;

  beforeEach(() => {
    service = new MixComponentCatalogService(new MaterialCatalogService());
  });

  describe('listGroups', () => {
    it('group order equals MIX_COMPONENT_GROUPS', () => {
      expect(service.listGroups().map(g => g.group)).toEqual([...MIX_COMPONENT_GROUPS]);
    });

    it('60 materials with the expected count per group', () => {
      const groups = service.listGroups();
      expect(groups.reduce((sum, g) => sum + g.materials.length, 0)).toBe(60);
      for (const group of groups) {
        expect(group.materials).toHaveLength(EXPECTED_COUNTS[group.group]);
      }
    });

    it("every material's primary group equals its group", () => {
      for (const group of service.listGroups()) {
        expect(group.materials.every(m => m.materialGroup[0] === group.group)).toBe(true);
      }
    });

    it('no glass, phosphate, boride, fluoride, borate, carbonate or hydroxide primary group', () => {
      const excluded = [
        MaterialGroup.GLASS, MaterialGroup.PHOSPHATE, MaterialGroup.BORIDE, MaterialGroup.FLUORIDE,
        MaterialGroup.BORATE, MaterialGroup.CARBONATE, MaterialGroup.HYDROXIDE,
      ];
      const primaries = service.listGroups().flatMap(g => g.materials.map(m => m.materialGroup[0]));
      expect(primaries.some(p => excluded.includes(p))).toBe(false);
    });

    it('paper_clay (fibre) is absent', () => {
      const ids = service.listGroups().flatMap(g => g.materials.map(m => m.materialId));
      expect(ids).not.toContain('paper_clay');
    });
  });

  describe('getMixComponent', () => {
    it('alumina_tabular - returned', () => {
      expect(service.getMixComponent('alumina_tabular').materialId).toBe('alumina_tabular');
    });

    it.each(['soda_lime_glass', 'calcium_fluoride', 'paper_clay'])('%s - throws BadRequestException', id => {
      expect(() => service.getMixComponent(id)).toThrow(BadRequestException);
    });

    it('unknown id - throws NotFoundException', () => {
      expect(() => service.getMixComponent('unknown_material')).toThrow(NotFoundException);
    });
  });
});
