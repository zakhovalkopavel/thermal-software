import { MetalSeriesPoints } from '../../../../src/modules/metals/utils/metal-series-points';
import { MetalDataset } from '../../../../src/modules/metals/utils/metal-dataset';
import { MetalAlloyRecord } from '../../../../src/modules/metals/types/metal-alloy-record.type';

describe('MetalSeriesPoints', () => {
  afterEach(() => {
    MetalDataset.resetCache();
    jest.restoreAllMocks();
  });

  it('returns own points when no donor', () => {
    const alloy = {
      properties: {
        thermalConductivity: {
          unit: 'W/(m·K)',
          sources: [],
          points: [
            { T_K: 300, value: 50 },
            { T_K: 400, value: 48 },
          ],
        },
      },
    } as unknown as MetalAlloyRecord;
    expect(MetalSeriesPoints.effective(alloy, 'thermalConductivity')).toEqual([
      { T_K: 300, value: 50 },
      { T_K: 400, value: 48 },
    ]);
  });

  it('full-series resolves donor knots without copying onto the alloy', () => {
    jest.spyOn(MetalDataset, 'loadAlloy').mockReturnValue({
      properties: {
        thermalConductivity: {
          unit: 'W/(m·K)',
          sources: [],
          points: [
            { T_K: 300, value: 40 },
            { T_K: 400, value: 38 },
            { T_K: 500, value: 36 },
          ],
        },
      },
    } as unknown as MetalAlloyRecord);

    const alloy = {
      properties: {
        thermalConductivity: {
          unit: 'W/(m·K)',
          sources: [],
          points: [],
        },
      },
      provenance: {
        donors: {
          thermalConductivity: {
            materialId: 'sae-4130',
            mode: 'full-series',
            why: 'link',
            compositionDistance: 1,
          },
        },
      },
    } as unknown as MetalAlloyRecord;

    const knots = MetalSeriesPoints.effective(alloy, 'thermalConductivity');
    expect(alloy.properties.thermalConductivity.points).toEqual([]);
    expect(knots).toHaveLength(3);
    expect(knots[0]).toEqual({ T_K: 300, value: 40 });
  });

  it('scaled-series multiplies donor values and prefers own at same T', () => {
    jest.spyOn(MetalDataset, 'loadAlloy').mockReturnValue({
      properties: {
        thermalConductivity: {
          unit: 'W/(m·K)',
          sources: [],
          points: [
            { T_K: 300, value: 40 },
            { T_K: 400, value: 38 },
          ],
        },
      },
    } as unknown as MetalAlloyRecord);

    const alloy = {
      properties: {
        thermalConductivity: {
          unit: 'W/(m·K)',
          sources: [],
          points: [{ T_K: 300, value: 44 }],
        },
      },
      provenance: {
        donors: {
          thermalConductivity: {
            materialId: 'sae-1008',
            mode: 'scaled-series',
            why: 'link',
            compositionDistance: 0.1,
            scale: 1.1,
          },
        },
      },
    } as unknown as MetalAlloyRecord;

    const knots = MetalSeriesPoints.effective(alloy, 'thermalConductivity');
    expect(knots.find(p => p.T_K === 300)?.value).toBe(44);
    expect(knots.find(p => p.T_K === 400)?.value).toBeCloseTo(41.8, 6);
  });
});
