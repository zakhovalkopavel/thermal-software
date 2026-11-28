import { kelvinToCelsius } from '@/shared/utils/kelvin-to-celsius';
import type { WallPropertyPoint } from '../types/wall-property-point.type';
import type { XYSeries } from '@/shared/ui/charts';

/** λ(T) and ε(T) for the wall-property chart: x = T [°C]. */
export function toWallPropertySeries(profile: WallPropertyPoint[]): XYSeries[] {
  return [
    {
      name: 'λ',
      emphasis: true,
      unit: 'W/(m·K)',
      data: profile.map((point) => [kelvinToCelsius(point.T_K), point.lambda_WmK]),
    },
    {
      name: 'ε',
      yAxis: 1,
      unit: '—',
      data: profile.map((point) => [kelvinToCelsius(point.T_K), point.emissivity]),
    },
  ];
}
