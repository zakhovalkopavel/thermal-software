import { BadRequestException } from '@nestjs/common';
import { ShrinkageService } from '../../../../../src/modules/refractory/services/thermal/shrinkage.service';
import { MSC_DEFAULTS } from '../../../../../src/modules/refractory/constants/msc-defaults.constants';

describe('ShrinkageService', () => {
  let service: ShrinkageService;

  const validInput = {
    materials: [
      { activationEnergy_Jmol: 500000 },
      { activationEnergy_Jmol: 400000 },
    ],
    massFractions: [0.6, 0.4],
    temperatureProfile_C: [800, 1200],
    waterCementRatio: 0.35,
    cementContent: 0.15,
  };

  beforeEach(() => {
    service = new ShrinkageService();
  });

  describe('calculateCompleteShrinkage — happy path', () => {
    it('returns drying, firing, total, and metadata', () => {
      const res = service.calculateCompleteShrinkage(validInput);
      expect(res.drying).toBeDefined();
      expect(Array.isArray(res.firing)).toBe(true);
      expect(res.firing).toHaveLength(validInput.temperatureProfile_C.length);
      expect(res.total).toBeDefined();
      expect(res.metadata).toBeDefined();
      expect(res.warnings).toEqual([]);
    });

    it('records each profile temperature on the matching firing stage', () => {
      const profile = [600, 900, 1100, 1400];
      const res = service.calculateCompleteShrinkage({
        ...validInput,
        temperatureProfile_C: profile,
      });
      expect(res.firing.map((s) => s.sinteringTemperature_C)).toEqual(profile);
      expect(res.firing.every((s) => s.name === 'firing')).toBe(true);
    });

    it('defaults waterCementRatio and cementContent when omitted', () => {
      const withDefaults = service.calculateCompleteShrinkage({
        materials: [{ activationEnergy_Jmol: MSC_DEFAULTS.activationEnergy_Jmol }],
        massFractions: [1],
        temperatureProfile_C: [1000],
      });
      const explicit = service.calculateCompleteShrinkage({
        materials: [{ activationEnergy_Jmol: MSC_DEFAULTS.activationEnergy_Jmol }],
        massFractions: [1],
        temperatureProfile_C: [1000],
        waterCementRatio: 0.35,
        cementContent: 0.15,
      });
      expect(withDefaults.metadata).toEqual(explicit.metadata);
      expect(withDefaults.drying).toEqual(explicit.drying);
    });

    it('falls back to MSC default activation energy when materials omit it', () => {
      const res = service.calculateCompleteShrinkage({
        materials: [{}, {}],
        massFractions: [0.5, 0.5],
        temperatureProfile_C: [1000],
      });
      expect(res.firing).toHaveLength(1);
      expect(res.firing[0].masterSinteringCurve_theta).toEqual(expect.any(Number));
    });

    it('increases relative density across a rising temperature profile', () => {
      const res = service.calculateCompleteShrinkage({
        materials: [{ activationEnergy_Jmol: 450000 }],
        massFractions: [1],
        temperatureProfile_C: [700, 1000, 1300],
      });
      const dens = res.firing.map((s) => s.relativeDensity[0]);
      expect(dens[dens.length - 1]).toBeGreaterThanOrEqual(dens[0]);
    });
  });

  describe('calculateFromProfile', () => {
    it('delegates to complete shrinkage with a single unit mass fraction', () => {
      const fromProfile = service.calculateFromProfile({
        temperatureProfile_C: [800, 1200],
        waterCementRatio: 0.3,
        cementContent: 0.1,
      });
      const complete = service.calculateCompleteShrinkage({
        materials: [{ activationEnergy_Jmol: MSC_DEFAULTS.activationEnergy_Jmol }],
        massFractions: [1.0],
        temperatureProfile_C: [800, 1200],
        waterCementRatio: 0.3,
        cementContent: 0.1,
      });
      expect(fromProfile.drying).toEqual(complete.drying);
      expect(fromProfile.firing).toHaveLength(complete.firing.length);
      const { calculatedAt: _a, ...fromMeta } = fromProfile.metadata as Record<string, unknown>;
      const { calculatedAt: _b, ...completeMeta } = complete.metadata as Record<string, unknown>;
      expect(fromMeta).toEqual(completeMeta);
    });
  });

  describe('validation', () => {
    it('throws when materials and massFractions lengths differ', () => {
      expect(() =>
        service.calculateCompleteShrinkage({
          materials: [{}, {}],
          massFractions: [1],
          temperatureProfile_C: [800],
        }),
      ).toThrow(BadRequestException);
    });

    it('throws when mass fractions do not sum to 1', () => {
      expect(() =>
        service.calculateCompleteShrinkage({
          materials: [{}, {}],
          massFractions: [0.2, 0.3],
          temperatureProfile_C: [800],
        }),
      ).toThrow(BadRequestException);
    });

    it('accepts mass fractions within 0.001 of 1.0', () => {
      expect(() =>
        service.calculateCompleteShrinkage({
          materials: [{}, {}],
          massFractions: [0.5004, 0.4995],
          temperatureProfile_C: [900],
        }),
      ).not.toThrow();
    });
  });
});
