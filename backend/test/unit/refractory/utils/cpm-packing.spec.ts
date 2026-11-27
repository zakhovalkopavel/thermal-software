import { CpmPacking } from '../../../../src/modules/refractory/utils/cpm-packing';

describe('CpmPacking', () => {
  it('loosening and wall effects are asymmetric', () => {
    expect(CpmPacking.loosening(4.5, 0.5)).toBeGreaterThan(0);
    expect(CpmPacking.wallEffect(0.5, 4.5)).toBeGreaterThan(0);
    expect(CpmPacking.loosening(4.5, 0.5)).not.toBeCloseTo(CpmPacking.wallEffect(0.5, 4.5), 3);
    expect(CpmPacking.interaction(1, 1)).toBe(0);
  });

  it('sizeInteraction is 1 for equal sizes and approaches beta for large ratios', () => {
    expect(CpmPacking.sizeInteraction(2, 2, 0.56)).toBe(1);
    const far = CpmPacking.sizeInteraction(4.5, 0.05, 0.56);
    expect(far).toBeGreaterThan(0.56);
    expect(far).toBeLessThan(0.6);
  });

  it('solve depends on volume fractions for a coarse + fine binary', () => {
    const diameters = [4.5, 0.5];
    const beta = [0.56, 0.56];
    const coarseHeavy = CpmPacking.solve([0.7, 0.3], beta, diameters);
    const fineHeavy = CpmPacking.solve([0.3, 0.7], beta, diameters);
    expect(Math.abs(coarseHeavy - fineHeavy)).toBeGreaterThan(0.01);
    expect(coarseHeavy).toBeGreaterThan(0.56);
    expect(fineHeavy).toBeGreaterThan(0.56);
    expect(coarseHeavy).toBeGreaterThan(fineHeavy);
  });

  it('graded quaternary packing exceeds mono and stays below dense-castable cap', () => {
    const mono = CpmPacking.solve([1], [0.56], [4.5]);
    const graded = CpmPacking.solve(
      [0.35, 0.25, 0.2, 0.15],
      [0.56, 0.56, 0.56, 0.56],
      [4.5, 2, 0.2, 0.015],
    );
    const coarseHeavy = CpmPacking.solve(
      [0.7, 0.1, 0.1, 0.1],
      [0.56, 0.56, 0.56, 0.56],
      [4.5, 2, 0.2, 0.015],
    );
    expect(mono).toBeCloseTo(0.56, 6);
    expect(graded).toBeGreaterThan(mono + 0.05);
    expect(graded).toBeLessThan(0.76);
    expect(graded).not.toBeCloseTo(coarseHeavy, 2);
  });

  it('mono-size packing equals the virtual packing', () => {
    expect(CpmPacking.solve([1], [0.56], [1])).toBeCloseTo(0.56, 6);
  });
});
