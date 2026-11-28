import { describe, expect, it } from 'vitest';
import { CalculatorPathFromInfoPath } from './calculator-path-from-info-path';

describe('CalculatorPathFromInfoPath', () => {
  it('maps in-page info paths to calculator routes', () => {
    expect(CalculatorPathFromInfoPath.resolve('/info/materials/gases/pure')).toBe('/materials/gases');
    expect(CalculatorPathFromInfoPath.resolve('/info/processes/htc/body')).toBe('/processes/htc');
  });

  it('maps overflow detail paths to calculator routes', () => {
    expect(CalculatorPathFromInfoPath.resolve('/info/materials/gases/details/heat-capacity')).toBe(
      '/materials/gases',
    );
    expect(
      CalculatorPathFromInfoPath.resolve('/info/processes/thermal-distribution/details/geometries-and-bcs'),
    ).toBe('/processes/thermal-distribution');
  });

  it('returns null for non-info paths', () => {
    expect(CalculatorPathFromInfoPath.resolve('/materials/gases')).toBeNull();
    expect(CalculatorPathFromInfoPath.resolve('/about')).toBeNull();
  });
});
