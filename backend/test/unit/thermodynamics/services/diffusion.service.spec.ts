import { DiffusionService } from '../../../../src/modules/thermodynamics/services/diffusion.service';
import { Species } from '../../../../src/modules/thermodynamics/enums/species.enum';
import { ChapmanEnskogDiffusion } from '../../../../src/modules/thermodynamics/utils/viscosity/chapman-enskog-diffusion';
import { GAS_REGISTRY } from '../../../../src/common/thermal/compound/gas/registry';

describe('DiffusionService', () => {
  const service = new DiffusionService();

  describe('binaryDiffusion', () => {
    it('matches shared ChapmanEnskogDiffusion util', () => {
      const T = 300;
      const P = 1;
      const a = GAS_REGISTRY.N2;
      const b = GAS_REGISTRY.O2;
      const expected = ChapmanEnskogDiffusion.binary(
        a.Mr, b.Mr,
        a.collisionDiameter!, b.collisionDiameter!,
        a.epsilonToKb!, b.epsilonToKb!,
        T, P,
      );
      expect(service.binaryDiffusion(Species.N2, Species.O2, T, P)).toBeCloseTo(expected, 12);
    });

    it('N2–O2 at 300 K, 1 atm is near ~2e-5 m²/s', () => {
      const D = service.binaryDiffusion(Species.N2, Species.O2, 300, 1);
      expect(D).toBeGreaterThan(1.5e-5);
      expect(D).toBeLessThan(2.6e-5);
    });

    it('increases with temperature and decreases with pressure', () => {
      const cold = service.binaryDiffusion(Species.N2, Species.O2, 300, 1);
      const hot = service.binaryDiffusion(Species.N2, Species.O2, 600, 1);
      const dense = service.binaryDiffusion(Species.N2, Species.O2, 300, 2);
      expect(hot).toBeGreaterThan(cold);
      expect(dense).toBeCloseTo(cold / 2, 8);
    });

    it('throws for unknown species', () => {
      expect(() =>
        service.binaryDiffusion('XX' as Species, Species.N2, 300, 1),
      ).toThrow(/Unknown species/);
    });
  });

  describe('effectiveDiffusion / getAllDiffusionCoefficients', () => {
    const mole = {
      [Species.N2]: 0.79,
      [Species.O2]: 0.21,
    };

    it('returns positive effective D for each mixture species', () => {
      const dN2 = service.effectiveDiffusion(Species.N2, mole, 300, 1);
      const dO2 = service.effectiveDiffusion(Species.O2, mole, 300, 1);
      expect(dN2).toBeGreaterThan(0);
      expect(dO2).toBeGreaterThan(0);
    });

    it('returns 0 when the species is alone in the mixture', () => {
      expect(
        service.effectiveDiffusion(Species.N2, { [Species.N2]: 1 }, 300, 1),
      ).toBe(0);
    });

    it('getAllDiffusionCoefficients maps every tracked species', () => {
      const all = service.getAllDiffusionCoefficients(mole, 350, 1);
      expect(Object.keys(all).sort()).toEqual(['N2', 'O2']);
      expect(all[Species.N2]).toBeCloseTo(
        service.effectiveDiffusion(Species.N2, mole, 350, 1),
        12,
      );
    });
  });
});
