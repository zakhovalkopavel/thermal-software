import { HoleForm } from '../../../../src/modules/recuperator/enums/hole-form.enum';
import { RecuperatorGeometryService } from '../../../../src/modules/recuperator/services/recuperator-geometry.service';

describe('RecuperatorGeometryService', () => {
  let service: RecuperatorGeometryService;

  beforeEach(() => {
    service = new RecuperatorGeometryService();
  });

  describe('getArea', () => {
    it('SQUARE air channels - returns total square flow area', () => {
      const expected = 0.04 * 0.04 * 100; // a² · nAir
      expect(service.getArea(0.04, HoleForm.SQUARE, 'air', 100, 0, 0, 0, 1)).toBeCloseTo(expected, 4);
    });

    it('CIRCLE air channels - returns total circular flow area', () => {
      const expected = (Math.PI * 0.04 * 0.04 / 4) * 100; // πd²/4 · nAir
      expect(service.getArea(0.04, HoleForm.CIRCLE, 'air', 100, 0, 0, 0, 1)).toBeCloseTo(expected, 4);
    });

    it('CIRCLE_IN_RING smoke channel - returns inner-pipe area', () => {
      const dSmoke = 0.06 - 2 * 0.005;
      const expected = Math.PI * dSmoke * dSmoke / 4; // πdSmoke²/4
      expect(service.getArea(0.06, HoleForm.CIRCLE_IN_RING, 'smoke', 0, 1, 0.005, 0, 1)).toBeCloseTo(expected, 5);
    });
  });

  describe('getPerimeter', () => {
    it('SQUARE air channels - returns total wetted perimeter', () => {
      const expected = 4 * 0.04 * 100; // 4a · nAir
      expect(service.getPerimeter(0.04, HoleForm.SQUARE, 'air', 100, 0, 0)).toBeCloseTo(expected, 10);
    });

    it('CIRCLE air channels - returns total wetted perimeter', () => {
      const expected = Math.PI * 0.04 * 100; // πd · nAir
      expect(service.getPerimeter(0.04, HoleForm.CIRCLE, 'air', 100, 0, 0)).toBeCloseTo(expected, 3);
    });

    it('CIRCLE_IN_RING air channel - returns outer ring perimeter', () => {
      const expected = Math.PI * 0.06; // πd_outer_contact
      expect(service.getPerimeter(0.06, HoleForm.CIRCLE_IN_RING, 'air', 1, 0, 0.005)).toBeCloseTo(expected, 4);
    });
  });

  describe('dEq', () => {
    it('circular area - returns the original diameter', () => {
      const area = Math.PI * 0.01 / 4; // area of a circle with d = 0.1 m
      expect(service.dEq(area)).toBeCloseTo(0.1, 10);
    });

    it('arbitrary area - returns the equivalent diameter', () => {
      const expected = Math.sqrt(4 * 0.04 / Math.PI); // dEq = sqrt(4A / π)
      expect(service.dEq(0.04)).toBeCloseTo(expected, 4);
    });
  });

  describe('getRayLength', () => {
    it('CIRCLE air channel - returns 0.9 times the diameter', () => {
      expect(service.getRayLength(HoleForm.CIRCLE, 0.04, 0, 0, 'air')).toBeCloseTo(0.9 * 0.04, 10);
    });

    it('CIRCLE_IN_RING air channel - returns 1.8 times the annulus thickness', () => {
      expect(service.getRayLength(HoleForm.CIRCLE_IN_RING, 0.06, 0.005, 0.01, 'air')).toBeCloseTo(1.8 * 0.01, 10);
    });
  });
});
