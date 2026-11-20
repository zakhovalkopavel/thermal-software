import { MetalAlloyRecord } from '../types/metal-alloy-record.type';
import { MetalPropertySeries } from '../types/metal-property-series.type';
import { MetalDataset } from './metal-dataset';

type Knot = { T_K: number; value: number };

/**
 * Build evaluation knots for a property: own `points` only, plus donor×scale by mode.
 * Donor knots are never stored on the alloy — resolve the linked material at read time.
 */
export class MetalSeriesPoints {
  static effective(
    alloy: MetalAlloyRecord,
    prop: string,
  ): Knot[] {
    const series = alloy.properties[prop];
    if (!series) return [];
    const own = series.points ?? [];
    const donorMeta = alloy.provenance?.donors?.[prop];
    if (!donorMeta) return [...own];

    const donorAlloy = MetalDataset.loadAlloy(donorMeta.materialId);
    const donorSeries = donorAlloy?.properties[prop];
    if (!donorSeries?.points?.length) return [...own];

    const scale = donorMeta.scale ?? 1;
    const donorScaled: Knot[] = donorSeries.points.map(p => ({
      T_K: p.T_K,
      value: p.value * scale,
    }));

    if (donorMeta.mode === 'extend-outside-range') {
      return MetalSeriesPoints.mergeExtendOutside(own, donorScaled, series);
    }
    return MetalSeriesPoints.mergeOwnPreferred(own, donorScaled);
  }

  /** Own knots win at matching T; fill gaps from scaled donor. */
  private static mergeOwnPreferred(own: Knot[], donorScaled: Knot[]): Knot[] {
    const byT = new Map<number, number>();
    for (const p of donorScaled) byT.set(MetalSeriesPoints.keyT(p.T_K), p.value);
    for (const p of own) byT.set(MetalSeriesPoints.keyT(p.T_K), p.value);
    return [...byT.entries()]
      .map(([t, value]) => ({ T_K: t, value }))
      .sort((a, b) => a.T_K - b.T_K);
  }

  /** Own knots in approx window; scaled donor only outside [Tmin, Tmax]. */
  private static mergeExtendOutside(
    own: Knot[],
    donorScaled: Knot[],
    series: MetalPropertySeries,
  ): Knot[] {
    const approx = series.approximation;
    let tMin = Number.NEGATIVE_INFINITY;
    let tMax = Number.POSITIVE_INFINITY;
    if (approx?.low) {
      tMin = approx.low.min;
      tMax = approx.high?.max ?? approx.low.max;
    }
    const exterior = donorScaled.filter(
      p => p.T_K < tMin - 1e-9 || p.T_K > tMax + 1e-9,
    );
    return MetalSeriesPoints.mergeOwnPreferred(own, exterior);
  }

  private static keyT(t: number): number {
    return Math.round(t * 1e6) / 1e6;
  }
}
