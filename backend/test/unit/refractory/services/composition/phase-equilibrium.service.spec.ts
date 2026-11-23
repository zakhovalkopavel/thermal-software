import { BadRequestException } from '@nestjs/common';
import { PhaseEquilibriumService } from '../../../../../src/modules/refractory/services/composition/phase-equilibrium.service';
import { PHASE_EQUILIBRIUM_CONSTANTS } from '../../../../../src/modules/refractory/constants/phase-equilibrium.constants';
import { CALCULATION_CONSTANTS } from '../../../../../src/modules/refractory/constants/calculation.constants';

const { EUTECTIC_TEMPERATURE_C } = PHASE_EQUILIBRIUM_CONSTANTS;

describe('PhaseEquilibriumService', () => {
  let service: PhaseEquilibriumService;

  /** Composition keys match OxideCompositionDto / COMPONENT_PROPERTIES formulas. */
  const casEutectic = { SiO2: 34.8, Al2O3: 36.8, CaO: 28.4 };
  const highAlumina = { Al2O3: 70, SiO2: 25, CaO: 5 };
  const nearHundred = { SiO2: 50, Al2O3: 40, CaO: 10 };

  beforeEach(() => {
    service = new PhaseEquilibriumService();
  });

  describe('calculatePhaseEquilibrium — happy path', () => {
    it('returns liquid, solid, metadata, and warnings arrays', () => {
      const res = service.calculatePhaseEquilibrium({
        composition: nearHundred,
        temperature: 1400,
      });
      expect(res.liquid).toEqual(
        expect.objectContaining({
          percent: expect.any(Number),
          mass: expect.any(Number),
          composition: expect.any(Object),
        }),
      );
      expect(res.solid).toEqual(
        expect.objectContaining({
          percent: expect.any(Number),
          mass: expect.any(Number),
          mineralPhases: expect.any(Array),
        }),
      );
      expect(res.metadata).toEqual(
        expect.objectContaining({
          temperature: 1400,
          totalMass: 100,
          eutecticTemperature: EUTECTIC_TEMPERATURE_C,
          estimatedLiquidus: expect.any(Number),
          calculatedAt: expect.any(Date),
        }),
      );
      expect(Array.isArray(res.warnings)).toBe(true);
      expect(res.liquid.percent + res.solid.percent).toBeCloseTo(100, 1);
    });

    it('scales liquid/solid mass by totalMass', () => {
      const res = service.calculatePhaseEquilibrium({
        composition: nearHundred,
        temperature: 1500,
        totalMass: 250,
      });
      expect(res.metadata.totalMass).toBe(250);
      expect(res.liquid.mass + res.solid.mass).toBeCloseTo(250, 0);
    });

    it('accepts compositions that sum within 95–105%', () => {
      expect(() =>
        service.calculatePhaseEquilibrium({
          composition: { SiO2: 48, Al2O3: 48, CaO: 2 },
          temperature: 1400,
        }),
      ).not.toThrow();
    });
  });

  describe('temperature regimes', () => {
    it('returns zero liquid at or below eutectic temperature', () => {
      const atEutectic = service.calculatePhaseEquilibrium({
        composition: casEutectic,
        temperature: EUTECTIC_TEMPERATURE_C,
      });
      expect(atEutectic.liquid.percent).toBe(0);
      expect(atEutectic.solid.percent).toBe(100);
      expect(Object.keys(atEutectic.liquid.composition)).toHaveLength(0);

      const below = service.calculatePhaseEquilibrium({
        composition: casEutectic,
        temperature: EUTECTIC_TEMPERATURE_C - 50,
      });
      expect(below.liquid.percent).toBe(0);
    });

    it('returns full liquid when temperature is at or above estimated liquidus', () => {
      const probe = service.calculatePhaseEquilibrium({
        composition: casEutectic,
        temperature: EUTECTIC_TEMPERATURE_C + 1,
      });
      // metadata liquidus is rounded; add 1 °C so we clear the unrounded private estimate
      const full = service.calculatePhaseEquilibrium({
        composition: casEutectic,
        temperature: probe.metadata.estimatedLiquidus + 1,
      });
      expect(full.liquid.percent).toBe(100);
      expect(full.solid.percent).toBe(0);
      expect(full.liquid.composition.SiO2).toBeCloseTo(casEutectic.SiO2, 1);
    });

    it('forms intermediate liquid between eutectic and liquidus', () => {
      const probe = service.calculatePhaseEquilibrium({
        composition: highAlumina,
        temperature: EUTECTIC_TEMPERATURE_C + 1,
      });
      const liquidus = probe.metadata.estimatedLiquidus;
      expect(liquidus).toBeGreaterThan(EUTECTIC_TEMPERATURE_C + 50);
      const midT = Math.round((EUTECTIC_TEMPERATURE_C + liquidus) / 2);
      const mid = service.calculatePhaseEquilibrium({
        composition: highAlumina,
        temperature: midT,
      });
      expect(mid.liquid.percent).toBeGreaterThan(0);
      expect(mid.liquid.percent).toBeLessThan(100);
    });
  });

  describe('mineral phases and enrichment', () => {
    it('identifies Corundum for high-Al2O3 solid (mixed-case keys for phase rules)', () => {
      const res = service.calculatePhaseEquilibrium({
        composition: { Al2O3: 70, SiO2: 25, CaO: 5 },
        temperature: EUTECTIC_TEMPERATURE_C,
      });
      expect(res.solid.mineralPhases.some((p: string) => p.includes('Corundum'))).toBe(true);
    });

    it('identifies Anorthite / Gehlenite when CaO is present in solid', () => {
      const res = service.calculatePhaseEquilibrium({
        composition: { SiO2: 40, Al2O3: 35, CaO: 25 },
        temperature: EUTECTIC_TEMPERATURE_C,
      });
      const joined = res.solid.mineralPhases.join(' ');
      expect(joined.includes('Anorthite') || joined.includes('Gehlenite')).toBe(true);
    });

    it('falls back to Mixed solid solution when no phase rule matches', () => {
      const res = service.calculatePhaseEquilibrium({
        composition: { Fe2O3: 100 },
        temperature: EUTECTIC_TEMPERATURE_C,
      });
      expect(res.solid.mineralPhases).toEqual(['Mixed solid solution']);
    });
  });

  describe('validation', () => {
    it('throws when composition sum is far from 100%', () => {
      expect(() =>
        service.calculatePhaseEquilibrium({
          composition: { SiO2: 10 },
          temperature: 1400,
        }),
      ).toThrow(BadRequestException);
    });

    it('throws when temperature is below minimum', () => {
      expect(() =>
        service.calculatePhaseEquilibrium({
          composition: nearHundred,
          temperature: CALCULATION_CONSTANTS.MIN_TEMPERATURE_C - 1,
        }),
      ).toThrow(BadRequestException);
    });

    it('throws when temperature is above maximum', () => {
      expect(() =>
        service.calculatePhaseEquilibrium({
          composition: nearHundred,
          temperature: CALCULATION_CONSTANTS.MAX_TEMPERATURE_C + 1,
        }),
      ).toThrow(BadRequestException);
    });
  });
});
