import { AbdulLiquidDataset } from '../../../../src/modules/refractory/utils/abdul-liquid-dataset';
import { CasLiquidExcess } from '../../../../src/modules/refractory/utils/cas-liquid-excess';
import { MaoLiquidDataset } from '../../../../src/modules/refractory/utils/mao-liquid-dataset';

describe('CasLiquidExcess', () => {
  afterEach(() => {
    AbdulLiquidDataset.resetCache();
    MaoLiquidDataset.resetCache();
  });

  it('returns associate or Mao or oxide-RK excess for a CAS liquid', () => {
    const result = CasLiquidExcess.evaluate({ Al2O3: 0.2, CaO: 0.3, SiO2: 0.5 }, 1800);
    expect(['associate', 'mao_ionic', 'abdul_rk']).toContain(result.mode);
    expect(Number.isFinite(result.excessGibbs_J)).toBe(true);
  });

  it('returns none outside CAS', () => {
    const result = CasLiquidExcess.evaluate({ MgO: 1 }, 1800);
    expect(result.mode).toBe('none');
    expect(result.excessGibbs_J).toBe(0);
  });
});
