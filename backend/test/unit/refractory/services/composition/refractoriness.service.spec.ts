import { RefractorinessService } from '../../../../../src/modules/refractory/services/composition/refractoriness.service';
import { CALCULATION_CONSTANTS } from '../../../../../src/modules/refractory/constants/calculation.constants';

describe('RefractorinessService', () => {
  let service: RefractorinessService;

  /** Effect lookup uses chemical-formula keys (`SiO2`, …). */
  const highAlumina = { SiO2: 20, Al2O3: 75, CaO: 5 };
  const highFlux = { SiO2: 40, Al2O3: 20, Na2O: 40 };

  beforeEach(() => {
    service = new RefractorinessService();
  });

  describe('calculateRefractoriness — ISO1893 (default)', () => {
    it('returns estimated temperature, RUL block, and classification', () => {
      const res = service.calculateRefractoriness(highAlumina);
      expect(typeof res.estimatedRefractoriness_C).toBe('number');
      expect(res.standard).toBe('ISO1893');
      expect(res.RUL).toEqual(
        expect.objectContaining({
          T05: expect.any(Number),
          T1: expect.any(Number),
          T2: expect.any(Number),
          testLoad_MPa: 0.2,
        }),
      );
      expect(res.RUL.T05).toBeLessThanOrEqual(res.RUL.T1);
      expect(res.RUL.T1).toBeLessThanOrEqual(res.RUL.T2);
      expect(res.classification).toMatch(/duty refractory$/);
    });

    it('yields higher refractoriness for alumina-rich vs flux-rich mixes', () => {
      const alumina = service.calculateRefractoriness(highAlumina, 'ISO1893');
      const flux = service.calculateRefractoriness(highFlux, 'ISO1893');
      expect(alumina.estimatedRefractoriness_C).toBeGreaterThan(flux.estimatedRefractoriness_C);
    });

    it('clamps extreme flux compositions to the minimum temperature', () => {
      const res = service.calculateRefractoriness({ Na2O: 100 }, 'ISO1893');
      expect(res.estimatedRefractoriness_C).toBe(CALCULATION_CONSTANTS.MIN_TEMPERATURE_C);
      expect(res.classification).toBe('Low duty refractory');
    });

    it('clamps extreme refractory compositions to the maximum temperature', () => {
      const res = service.calculateRefractoriness(
        { Al2O3: 50, ZrO2: 50 },
        'ISO1893',
      );
      expect(res.estimatedRefractoriness_C).toBeLessThanOrEqual(
        CALCULATION_CONSTANTS.MAX_TEMPERATURE_C,
      );
      expect(res.estimatedRefractoriness_C).toBeGreaterThan(
        CALCULATION_CONSTANTS.BASE_REFRACTORINESS_C,
      );
    });
  });

  describe('standards switch', () => {
    it('returns PCE cone number for ASTM_C24', () => {
      const res = service.calculateRefractoriness(highAlumina, 'ASTM_C24');
      expect(res.PCE).toEqual(
        expect.objectContaining({
          coneNumber: expect.any(Number),
          equivalentTemperature_C: res.estimatedRefractoriness_C,
        }),
      );
      expect(res.PCE.coneNumber).toBeGreaterThanOrEqual(10);
      expect(res.PCE.coneNumber).toBeLessThanOrEqual(40);
    });

    it('returns PCE_modified for ASTM_C71', () => {
      const res = service.calculateRefractoriness(highAlumina, 'ASTM_C71');
      expect(res.PCE_modified).toEqual(
        expect.objectContaining({
          coneNumber: expect.any(Number),
          deformationTemperature_C: expect.any(Number),
        }),
      );
    });

    it('returns GOST block for GOST4069', () => {
      const res = service.calculateRefractoriness(highAlumina, 'GOST4069');
      expect(res.GOST).toEqual(
        expect.objectContaining({
          refractorinessPoint_C: res.estimatedRefractoriness_C,
          coneSoftening: true,
        }),
      );
    });

    it('returns genericRefractoriness_C for unknown standards', () => {
      const res = service.calculateRefractoriness({ SiO2: 40, Al2O3: 60 }, 'UNKNOWN');
      expect(res).toHaveProperty('genericRefractoriness_C');
      expect(res.genericRefractoriness_C).toBe(res.estimatedRefractoriness_C);
      expect(res.RUL).toBeUndefined();
    });
  });

  describe('component extraction', () => {
    it('splits oxides, fluorides, and chlorides into components buckets (mixed-case API keys)', () => {
      const res = service.calculateRefractoriness(
        { SiO2: 40, Al2O3: 40, CaO: 10, CaF2: 5, NaCl: 5 },
        'ISO1893',
      );
      expect(res.components.oxides).toEqual(
        expect.objectContaining({ SiO2: 40, Al2O3: 40, CaO: 10 }),
      );
      expect(res.components.fluorides).toEqual(expect.objectContaining({ CaF2: 5 }));
      expect(res.components.chlorides).toEqual(expect.objectContaining({ NaCl: 5 }));
    });

    it('omits zero / missing oxide keys from component lists', () => {
      const res = service.calculateRefractoriness({ SiO2: 50, Al2O3: 50 }, 'ISO1893');
      expect(res.components.oxides.CaO).toBeUndefined();
      expect(Object.keys(res.components.fluorides)).toHaveLength(0);
      expect(Object.keys(res.components.chlorides)).toHaveLength(0);
    });
  });

  describe('duty classification', () => {
    it('classifies low duty for strong flux and high/super duty for formers', () => {
      const low = service.calculateRefractoriness({ Na2O: 100 }, 'ISO1893');
      expect(low.classification).toBe('Low duty refractory');

      const mid = service.calculateRefractoriness(
        { SiO2: 55, Al2O3: 35, CaO: 10 },
        'ISO1893',
      );
      expect(mid.classification).toMatch(/duty refractory$/);

      const superDuty = service.calculateRefractoriness(
        { Al2O3: 80, Cr2O3: 20 },
        'ISO1893',
      );
      expect(
        ['High duty refractory', 'Super duty refractory'].includes(superDuty.classification),
      ).toBe(true);
    });
  });
});
