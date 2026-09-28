import { Injectable } from '@nestjs/common';
import { HoleForm } from '../enums/hole-form.enum';

/**
 * RecuperatorGeometryService
 *
 * Cross-section geometry for all four hole forms.
 * Source: legacy getArea(), getPerimeter() — recuperator.js lines 697–754
 */
@Injectable()
export class RecuperatorGeometryService {

  /**
   * Wetted perimeter of the channel network [m].
   * For CIRCLE_IN_RING: returns the active circumference (smoke: inner pipe, air: outer ring).
   */
  getPerimeter(
    a_m: number, holeForm: HoleForm, type: 'air' | 'smoke',
    nAir: number, nSmoke: number, h_m: number,
  ): number {
    switch (holeForm) {
      case HoleForm.SQUARE:
        return 4 * a_m * (type === 'air' ? nAir : nSmoke);
      case HoleForm.CIRCLE:
        return Math.PI * a_m * (type === 'air' ? nAir : nSmoke);
      case HoleForm.TRIANGLE:
        return type === 'air' ? 3 * a_m : 3 * (a_m + 2 * h_m);
      case HoleForm.CIRCLE_IN_RING:
        return type === 'air' ? Math.PI * a_m : Math.PI * (a_m - 2 * h_m);
    }
  }

  /**
   * Total flow cross-section area [m²].
   * For CIRCLE_IN_RING: smoke = inner pipe, air = annular ring / nPasses.
   */
  getArea(
    a_m: number, holeForm: HoleForm, type: 'air' | 'smoke',
    nAir: number, nSmoke: number, h_m: number, h0_m: number, nPasses: number,
  ): number {
    switch (holeForm) {
      case HoleForm.SQUARE:
        return a_m * a_m * (type === 'air' ? nAir : nSmoke);

      case HoleForm.CIRCLE:
        return (Math.PI * a_m * a_m / 4) * (type === 'air' ? nAir : nSmoke);

      case HoleForm.TRIANGLE: {
        const airArea = (a_m * a_m * Math.sqrt(3)) / 4;
        if (type === 'air') return airArea;
        const rInner = Math.pow(3 / (16 * Math.PI), 0.25) * a_m;
        const rOuter = rInner + h_m;
        const smokeArea = (Math.PI * rOuter * rOuter) - ((a_m + 2 * h_m) * (a_m + 2 * h_m) * Math.sqrt(3) / 4);
        return (smokeArea / airArea) * airArea * nSmoke;
      }

      case HoleForm.CIRCLE_IN_RING: {
        if (type === 'smoke') {
          const dSmoke = a_m - 2 * h_m;
          return Math.PI * dSmoke * dSmoke / 4;
        }
        // air in annulus
        const outer = a_m + 2 * h0_m;
        return (Math.PI * (outer * outer - a_m * a_m) / 4) / nPasses;
      }
    }
  }

  /** Equivalent hydraulic diameter from cross-section area [m] */
  dEq(area_m2: number): number {
    return Math.sqrt(4 * area_m2 / Math.PI);
  }

  /** Mean beam length for gas radiation [m] */
  getRayLength(holeForm: HoleForm, a_m: number, h_m: number, h0_m: number, type: 'air' | 'smoke'): number {
    if (holeForm === HoleForm.CIRCLE_IN_RING) {
      return type === 'smoke' ? 0.9 * (a_m - 2 * h_m) : 1.8 * h0_m;
    }
    return 0.9 * a_m;
  }

  /** Outer surface equivalent diameter for natural convection cooling [m] */
  getOuterDiameter(
    holeForm: HoleForm, a_m: number, h_m: number, h0_m: number,
    h_ins_m: number, nAir: number, nSmoke: number,
  ): number {
    switch (holeForm) {
      case HoleForm.TRIANGLE:
        return a_m * Math.pow(3 / (Math.PI * 16), 0.25) + 4 * h_m + 2 * h_ins_m;
      case HoleForm.CIRCLE_IN_RING:
        return a_m + 2 * (h_ins_m + h0_m);
      default:
        return Math.ceil(Math.sqrt(nAir + nSmoke)) * (a_m + h_m) + h_m + 2 * h_ins_m;
    }
  }
}
