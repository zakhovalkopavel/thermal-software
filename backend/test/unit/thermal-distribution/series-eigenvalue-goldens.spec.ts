/**
 * CP5.0 / Phase 5 regression: bit-identical goldens from pre-refactor free functions.
 * Do not loosen to toBeCloseTo — exact equality only.
 */
import { SERIES_EIGENVALUE_GOLDENS as G } from './data/series-eigenvalue-goldens.data';
import { EigenvaluesBc1 } from '../../../src/modules/thermal-distribution/utils/eigenvalues-bc1';
import { EigenvaluesBc3 } from '../../../src/modules/thermal-distribution/utils/eigenvalues-bc3';
import { EigenvaluesHollowBc3 } from '../../../src/modules/thermal-distribution/utils/eigenvalues-hollow-bc3';
import { SeriesBc1 } from '../../../src/modules/thermal-distribution/utils/series-bc1';
import { SeriesBc3Plate } from '../../../src/modules/thermal-distribution/utils/series-bc3-plate';
import { SeriesBc3Cylinder } from '../../../src/modules/thermal-distribution/utils/series-bc3-cylinder';
import { SeriesBc3Sphere } from '../../../src/modules/thermal-distribution/utils/series-bc3-sphere';
import { SeriesHollowBc3 } from '../../../src/modules/thermal-distribution/utils/series-hollow-bc3';
import { CharacteristicLength } from '../../../src/modules/thermal-distribution/utils/characteristic-length';

const Bi = 1.5;
const Fo = 0.2;
const N = 8;

describe('series-eigenvalue goldens (exact)', () => {
  it('BC1 eigenvalues', () => {
    expect(EigenvaluesBc1.plateEigenvaluesBC1(N)).toEqual([...G.bc1.plate]);
    expect(EigenvaluesBc1.cylinderEigenvaluesBC1(N)).toEqual([...G.bc1.cylinder]);
    expect(EigenvaluesBc1.sphereEigenvaluesBC1(N)).toEqual([...G.bc1.sphere]);
  });

  it('BC3 eigenvalues', () => {
    expect(EigenvaluesBc3.plateEigenvaluesBC3(Bi, N)).toEqual([...G.bc3.plate]);
    expect(EigenvaluesBc3.cylinderEigenvaluesBC3(Bi, N)).toEqual([...G.bc3.cylinder]);
    expect(EigenvaluesBc3.sphereEigenvaluesBC3(Bi, N)).toEqual([...G.bc3.sphere]);
  });

  it('hollow BC3 eigenvalues and W0', () => {
    expect(EigenvaluesHollowBc3.hollowCylinderEigenvaluesBC3(0.02, 0.05, 20, 30, 5))
      .toEqual([...G.hollow.roots]);
    expect(EigenvaluesHollowBc3.hollowCylW0(50, 0.03, 0.02, 20)).toBe(G.hollow.W0);
  });

  it('series BC1 local/mean', () => {
    expect(SeriesBc1.plateLocalBC1(0.5, Fo, N)).toBe(G.seriesBc1.plateLocal);
    expect(SeriesBc1.plateMeanBC1(Fo, N)).toBe(G.seriesBc1.plateMean);
    expect(SeriesBc1.cylinderLocalBC1(0.5, Fo, N)).toBe(G.seriesBc1.cylLocal);
    expect(SeriesBc1.cylinderMeanBC1(Fo, N)).toBe(G.seriesBc1.cylMean);
    expect(SeriesBc1.sphereLocalBC1(0.5, Fo, N)).toBe(G.seriesBc1.sphLocal);
    expect(SeriesBc1.sphereMeanBC1(Fo, N)).toBe(G.seriesBc1.sphMean);
  });

  it('series BC3 local/mean (uniform)', () => {
    expect(SeriesBc3Plate.plateLocalBC3Uniform(0.5, Fo, Bi, N)).toBe(G.seriesBc3.plateLocal);
    expect(SeriesBc3Plate.plateMeanBC3Uniform(Fo, Bi, N)).toBe(G.seriesBc3.plateMean);
    expect(SeriesBc3Cylinder.cylinderLocalBC3Uniform(0.5, Fo, Bi, N)).toBe(G.seriesBc3.cylLocal);
    expect(SeriesBc3Cylinder.cylinderMeanBC3Uniform(Fo, Bi, N)).toBe(G.seriesBc3.cylMean);
    expect(SeriesBc3Sphere.sphereLocalBC3Uniform(0.5, Fo, Bi, N)).toBe(G.seriesBc3.sphLocal);
    expect(SeriesBc3Sphere.sphereMeanBC3Uniform(Fo, Bi, N)).toBe(G.seriesBc3.sphMean);
  });

  it('hollow series temp/mean', () => {
    const f1 = () => 20 - 850;
    expect(SeriesHollowBc3.hollowCylinderTempBC3(
      0.03, 120, 0.02, 0.05, 1000, 1200, 45, 1.2e-5, f1, 20, 5,
    )).toBe(G.hollowSeries.temp);
    expect(SeriesHollowBc3.hollowCylinderMeanTempBC3(
      120, 0.02, 0.05, 1000, 1200, 45, 1.2e-5, f1, 20, 5,
    )).toBe(G.hollowSeries.mean);
  });

  it('characteristic lengths', () => {
    expect(CharacteristicLength.compute({ geometry: 'plate', halfThickness: 0.05 }))
      .toEqual(G.lengths.plate);
    expect(CharacteristicLength.compute({
      geometry: 'hollow_cylinder', innerRadius: 0.02, outerRadius: 0.05,
    })).toEqual(G.lengths.hollow);
  });
});
