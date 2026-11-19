import { DiffusionService } from '../../../../src/modules/thermodynamics/services/diffusion.service';
import { Species } from '../../../../src/modules/thermodynamics/enums/species.enum';
import { ChapmanEnskogDiffusion } from '../../../../src/modules/thermodynamics/utils/viscosity/chapman-enskog-diffusion';
import { GAS_REGISTRY } from '../../../../src/common/thermal/compound/gas/registry';

describe('DiffusionService', () => {
  const service = new DiffusionService();

  it('binaryDiffusion matches shared ChapmanEnskogDiffusion util', () => {
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
});
