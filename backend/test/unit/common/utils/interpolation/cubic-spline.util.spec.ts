import { cubicSpline } from '../../../../../src/common/utils/interpolation';

describe('cubicSpline', () => {
  it('reproduces knots exactly', () => {
    const x = [0, 1, 2, 3, 4];
    const y = [0, 1, 0, 1, 0];
    const S = cubicSpline(x, y);
    for (let i = 0; i < x.length; i++) {
      expect(S.evaluate(x[i])).toBeCloseTo(y[i], 10);
    }
  });

  it('matches linear interpolation for two points', () => {
    const S = cubicSpline([0, 10], [0, 100]);
    expect(S.evaluate(5)).toBeCloseTo(50, 10);
  });

  it('rejects out-of-range evaluation', () => {
    const S = cubicSpline([100, 200, 300, 400], [1, 2, 3, 4]);
    expect(() => S.evaluate(99)).toThrow(/outside domain/);
    expect(() => S.evaluate(401)).toThrow(/outside domain/);
  });

  it('rejects non-increasing x', () => {
    expect(() => cubicSpline([1, 1, 2], [1, 2, 3])).toThrow(/strictly increasing/);
  });
});
