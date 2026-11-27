import { AbdulExpression } from '../../../../src/modules/refractory/utils/abdul-expression';
import { AbdulLiquid } from '../../../../src/modules/refractory/utils/abdul-liquid';
import { AbdulLiquidDataset } from '../../../../src/modules/refractory/utils/abdul-liquid-dataset';

describe('AbdulExpression', () => {
  afterEach(() => AbdulLiquidDataset.resetCache());

  it('evaluates numeric constants and T polynomials', () => {
    const functions = {
      ALL_SIO2L_L0: { Tmin_K: 1, Tmax_K: 10000, expression: '6952.81065916526', kind: 'expression' as const },
      ALL_SIO2L_L0T: { Tmin_K: 1, Tmax_K: 10000, expression: '7.45929355884341', kind: 'expression' as const },
    };
    const value = AbdulExpression.evaluate('T * ALL_SIO2L_L0T + ALL_SIO2L_L0', 1800, functions);
    expect(value).toBeCloseTo(1800 * 7.45929355884341 + 6952.81065916526, 6);
  });

  it('evaluates Einstein LN helpers from staging functions', () => {
    const data = AbdulLiquidDataset.load();
    expect(Object.keys(data.functions).length).toBeGreaterThan(100);
    const gSiO2L = data.liquid.endmemberG.find(row => row.parameter.includes('SIO2L'));
    expect(gSiO2L).toBeDefined();
    const value = AbdulExpression.evaluate(gSiO2L!.expression, 1800, data.functions);
    expect(Number.isFinite(value)).toBe(true);
    expect(value).toBeLessThan(0);
  });

  it('detects CAS coverage for Abdul liquid', () => {
    expect(AbdulLiquid.coversCas({ CaO: 30, Al2O3: 35, SiO2: 35 })).toBe(true);
    expect(AbdulLiquid.coversCas({ CaO: 20, Al2O3: 30, SiO2: 40, Na2O: 10 })).toBe(false);
    expect(AbdulLiquid.coversCas({ Al2O3: 100 })).toBe(false);
  });
});
