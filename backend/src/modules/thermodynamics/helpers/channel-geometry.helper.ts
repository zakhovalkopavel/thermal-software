import { FlowGeometry } from '../enums/flow-geometry.enum';
import { GeometryDimsDto } from '../dto/geometry-dims.dto';

/**
 * Channel and flow geometry helpers.
 */
export class ChannelGeometryHelper {

  /** Cross-sectional area [m²] for internal-flow geometries */
  static area(geometry: FlowGeometry, dims: GeometryDimsDto): number {
    const { a = 0, b = 0, c = 0 } = dims;
    switch (geometry) {
      case FlowGeometry.PIPE_CIRCULAR:    return Math.PI * a * a;
      case FlowGeometry.PIPE_ANNULUS:     return Math.PI / 4 * (b * b - a * a);
      case FlowGeometry.DUCT_SQUARE:      return a * a;
      case FlowGeometry.DUCT_RECTANGULAR: return a * b;
      case FlowGeometry.DUCT_TRIANGULAR:  return (Math.sqrt(3) / 4) * a * a;
      case FlowGeometry.PARALLEL_PLATES:  return a * b;
      case FlowGeometry.DUCT_ELLIPTICAL:  return Math.PI * a * b;
      case FlowGeometry.DUCT_TRAPEZOIDAL: return ((a + b) / 2) * c;
      default: return Math.PI * a * a;
    }
  }

  /** Wetted perimeter [m] for internal-flow geometries */
  static perimeter(geometry: FlowGeometry, dims: GeometryDimsDto): number {
    const { a = 0, b = 0, c = 0 } = dims;
    switch (geometry) {
      case FlowGeometry.PIPE_CIRCULAR:    return 2 * Math.PI * a;
      case FlowGeometry.PIPE_ANNULUS:     return Math.PI * (a + b);
      case FlowGeometry.DUCT_SQUARE:      return 4 * a;
      case FlowGeometry.DUCT_RECTANGULAR: return 2 * (a + b);
      case FlowGeometry.DUCT_TRIANGULAR:  return 3 * a;
      case FlowGeometry.PARALLEL_PLATES:  return 2 * (a + b);
      case FlowGeometry.DUCT_ELLIPTICAL: {
        const h = Math.pow(a - b, 2) / Math.pow(a + b, 2);
        return Math.PI * (a + b) * (1 + 3 * h / (10 + Math.sqrt(4 - 3 * h)));
      }
      case FlowGeometry.DUCT_TRAPEZOIDAL:
        return a + b + 2 * Math.sqrt(c * c + Math.pow((b - a) / 2, 2));
      default: return 2 * Math.PI * a;
    }
  }

  /** Hydraulic diameter D_h = 4A / P [m] — from cross-section geometry */
  static hydraulicDiameter(geometry: FlowGeometry, dims: GeometryDimsDto): number {
    return (4 * ChannelGeometryHelper.area(geometry, dims)) /
           ChannelGeometryHelper.perimeter(geometry, dims);
  }

  /**
   * Characteristic length for heat transfer correlations [m].
   * Explicit dims.L override takes priority.
   * Conventions per geometry:
   *   pipes/ducts       → hydraulic diameter D_h
   *   annulus           → gap width (b − a)
   *   flat plate        → plate length (dims.c ?? a)
   *   external cylinder → outer diameter 2a
   *   sphere            → diameter 2a  (a = radius)
   *   vertical surfaces → height b (or a if b=0)
   *   horizontal plate  → L_c = A/P = a·b / (2(a+b))
   *   packed bed        → particle diameter a
   */
  static characteristicLength(geometry: FlowGeometry, dims: GeometryDimsDto): number {
    if (dims.L !== undefined) return dims.L;
    const { a = 0, b = 0 } = dims;
    switch (geometry) {
      case FlowGeometry.PIPE_CIRCULAR:    return 2 * a;
      case FlowGeometry.PIPE_ANNULUS:     return b - a;
      case FlowGeometry.DUCT_SQUARE:
      case FlowGeometry.DUCT_RECTANGULAR:
      case FlowGeometry.DUCT_TRIANGULAR:
      case FlowGeometry.DUCT_TRIANGULAR_SCALENE:
      case FlowGeometry.DUCT_ELLIPTICAL:
      case FlowGeometry.DUCT_TRAPEZOIDAL:
      case FlowGeometry.PARALLEL_PLATES:
        return ChannelGeometryHelper.hydraulicDiameter(geometry, dims);
      case FlowGeometry.FLAT_PLATE:
      case FlowGeometry.FLAT_PLATE_ROUGH:    return dims.c ?? a;
      case FlowGeometry.CYLINDER_CROSSFLOW:  return 2 * a;
      case FlowGeometry.SPHERE_FORCED:       return 2 * a;   // a = radius
      case FlowGeometry.SPHERE_NATURAL:      return 2 * a;   // a = radius
      case FlowGeometry.VERTICAL_PLATE:
      case FlowGeometry.VERTICAL_CYLINDER:
      case FlowGeometry.INCLINED_PLATE:      return b !== 0 ? b : a;
      case FlowGeometry.HORIZONTAL_CYLINDER: return 2 * a;
      case FlowGeometry.HORIZONTAL_PLATE_HOT_UP:
      case FlowGeometry.HORIZONTAL_PLATE_HOT_DOWN:
        return (a * b) / (2 * (a + b));
      case FlowGeometry.PACKED_BED:
      case FlowGeometry.PACKED_BED_CYLINDER: return a;
      default: return a;
    }
  }
}
