import { MIX_COMPONENT_GROUPS } from '../../../../src/modules/refractory/constants/mix-component-groups.constants';
import { MIX_EXCLUDED_MATERIAL_IDS } from '../../../../src/modules/refractory/constants/mix-excluded-material-ids.constants';
import { ALL_MATERIALS } from '../../../../src/modules/refractory/data/all-materials.data';
import { MaterialGroup } from '../../../../src/modules/refractory/enums/material-group.enum';
import { AmorphousRemainder } from '../../../../src/modules/refractory/utils/amorphous-remainder';

describe('mix-component mineralogy consistency', () => {
  const mixMaterials = ALL_MATERIALS.filter(
    m =>
      m.isActive
      && !MIX_EXCLUDED_MATERIAL_IDS.includes(m.materialId)
      && MIX_COMPONENT_GROUPS.includes(m.materialGroup[0] as MaterialGroup),
  );

  it('gives every mix component a mineralogy table', () => {
    const missing = mixMaterials.filter(m => !m.mineralogy).map(m => m.materialId);
    expect(missing).toEqual([]);
  });

  it('keeps amorphous remainder ≥ 0 within tolerance for every mix component', () => {
    for (const material of mixMaterials) {
      expect(() => AmorphousRemainder.of(material.composition, material.mineralogy!)).not.toThrow();
    }
  });
});
