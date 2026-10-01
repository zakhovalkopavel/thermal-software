import { describe, expect, it } from 'vitest';
import { SODA_LIME_CURVE } from '../../../../../../tests/fixtures/inputs/soda-lime-glass-curve';
import { toFixedPointMarkers } from './fixed-point-markers.mapper';

describe('glasses › fixed-point-markers', () => {
  it('places the five fixed points at their reference viscosities', () => {
    expect(toFixedPointMarkers(SODA_LIME_CURVE.profile?.fixedPoints)).toEqual([
      [1455, 1e1],
      [1005, 1e3],
      [724, Math.pow(10, 6.6)],
      [546, 1e12],
      [506, Math.pow(10, 13.5)],
    ]);
  });

  it('is empty when the model gives no fixed points', () => {
    expect(toFixedPointMarkers(null)).toEqual([]);
    expect(toFixedPointMarkers(undefined)).toEqual([]);
  });
});
