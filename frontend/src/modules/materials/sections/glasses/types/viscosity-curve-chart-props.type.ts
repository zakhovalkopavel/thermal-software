import type { GlassCurve } from './glass-curve.type';
import type { GlassFixedPoints } from './glass-fixed-points.type';

export type ViscosityCurveChartProps = {
  curves: GlassCurve[];
  /** °C */
  xMin: number;
  xMax: number;
  userFixedPoints: GlassFixedPoints | null | undefined;
  atTemperature?: { temperature_C: number; logViscosity: number };
  atViscosity?: { temperature_C: number; targetLogEta: number };
  subtitle?: string;
};
