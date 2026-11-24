import type { XYSeries } from '@/shared/ui/charts';
import { kelvinToCelsius } from '@/shared/utils/kelvin-to-celsius';
import { toClampedZones } from '../../../mappers/clamped-zones.mapper';
import type { RefractoryProductResult } from '../../../types/refractory-product-result.type';
import type { RefractoryProductSummary } from '../../../types/refractory-product-summary.type';
import { toRefractorySeriesStyles } from './refractory-series-styles.mapper';

/** λ or ε series versus T [°C], one per product; ε dotted where clamped. */
export function toRefractoryPropertySeries(
  byMaterial: Record<string, RefractoryProductResult[]>,
  products: RefractoryProductSummary[],
  property: 'lambda_WmK' | 'emissivity',
): XYSeries[] {
  const styles = toRefractorySeriesStyles(Object.keys(byMaterial), products);
  return Object.entries(byMaterial).map(([materialId, rows]) => {
    const product = products.find((item) => item.materialId === materialId);
    return {
      name: styles[materialId]?.name ?? materialId,
      color: styles[materialId]?.color,
      data: [...rows].sort((a, b) => a.T_K - b.T_K).map((row) => [kelvinToCelsius(row.T_K), row[property]] as [number, number]),
      zones: property === 'emissivity' && product ? toClampedZones(product.emissivityRange_K, 'Solid', kelvinToCelsius) : undefined,
    };
  });
}
