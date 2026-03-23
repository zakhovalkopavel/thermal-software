import { BodyGeometry } from '../enums/body-geometry.enum';
import { GeometryDimsDto } from '../dto/dimensionless.dto';

/**
 * Body geometry calculations: surface area, volume, mean beam length.
 * Sphere, cylinder, cube verbatim from [Leg] recuperator.js
 * surfaceFunction() lines 1804–1824 and getRayLength() lines 1826–1843.
 */
export class BodyGeometryHelper {

  /** Surface area [m²] with optional insulation thickness h [m] */
  static area(geometry: BodyGeometry, dims: GeometryDimsDto, insulationH = 0): number {
    const { a = 0, b = 0, c = 0 } = dims;
    const h = insulationH;
    switch (geometry) {
      case BodyGeometry.SPHERE:
        return 4 * Math.PI * Math.pow(a + h, 2);                                     // [Leg 1807]
      case BodyGeometry.CYLINDER:
        return 2 * Math.PI * Math.pow(a + h, 2) + 2 * Math.PI * (a + h) * (b + 2 * h); // [Leg 1811]
      case BodyGeometry.CUBE:
        return 6 * Math.pow(a + 2 * h, 2);                                           // [Leg 1815]
      case BodyGeometry.RECTANGULAR_PRISM:
        return 2 * ((a + 2*h)*(b + 2*h) + (b + 2*h)*(c + 2*h) + (a + 2*h)*(c + 2*h));
      case BodyGeometry.TRIANGULAR_PRISM:
        return a * b + 3 * a * c;
      case BodyGeometry.CONE:
        return Math.PI * a * Math.sqrt(a * a + b * b) + Math.PI * a * a;
      case BodyGeometry.TRUNCATED_CONE:
        return Math.PI * (a + b) * Math.sqrt(Math.pow(a - b, 2) + c * c) + Math.PI * (a * a + b * b);
      case BodyGeometry.HOLLOW_CYLINDER:
        return 2 * Math.PI * b * c + 2 * Math.PI * (b * b - a * a);
      case BodyGeometry.ELLIPSOID: {
        const p = 1.6075;
        return 4 * Math.PI * Math.pow((Math.pow(a*b,p) + Math.pow(a*c,p) + Math.pow(b*c,p)) / 3, 1/p);
      }
      case BodyGeometry.HEMISPHERICAL_DOME:
        return 3 * Math.PI * a * a;
      default: return 0;
    }
  }

  /** Volume [m³] */
  static volume(geometry: BodyGeometry, dims: GeometryDimsDto): number {
    const { a = 0, b = 0, c = 0 } = dims;
    switch (geometry) {
      case BodyGeometry.SPHERE:            return (4/3) * Math.PI * a * a * a;
      case BodyGeometry.CYLINDER:          return Math.PI * a * a * b;
      case BodyGeometry.CUBE:              return a * a * a;
      case BodyGeometry.RECTANGULAR_PRISM: return a * b * c;
      case BodyGeometry.TRIANGULAR_PRISM:  return 0.5 * a * b * c;
      case BodyGeometry.CONE:              return (1/3) * Math.PI * a * a * b;
      case BodyGeometry.TRUNCATED_CONE:    return (Math.PI/3) * c * (a*a + a*b + b*b);
      case BodyGeometry.HOLLOW_CYLINDER:   return Math.PI * (b*b - a*a) * c;
      case BodyGeometry.ELLIPSOID:         return (4/3) * Math.PI * a * b * c;
      case BodyGeometry.HEMISPHERICAL_DOME:return (2/3) * Math.PI * a * a * a;
      default: return 0;
    }
  }

  /**
   * Mean beam length (Hottel approximation) [m].
   * SPHERE, CYLINDER, CUBE verbatim from [Leg] recuperator.js getRayLength() lines 1826–1843.
   * General fallback: L = 3.6·V/S — Hottel.
   */
  static meanBeamLength(geometry: BodyGeometry, dims: GeometryDimsDto): number {
    const { a = 0, b = 0 } = dims;
    switch (geometry) {
      case BodyGeometry.SPHERE:   return 0.6 * 2 * a;                          // [Leg 1829]
      case BodyGeometry.CYLINDER: return 3.6 * a * b / (2 * a + 2 * b);       // [Leg 1832]
      case BodyGeometry.CUBE:     return 0.6 * a;                              // [Leg 1835]
      default: {
        const V = BodyGeometryHelper.volume(geometry, dims);
        const S = BodyGeometryHelper.area(geometry, dims, 0);
        return S > 0 ? 3.6 * V / S : 0;
      }
    }
  }
}

