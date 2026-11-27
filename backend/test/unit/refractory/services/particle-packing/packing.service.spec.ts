import { PackingService } from '../../../../../src/modules/refractory/services/particle-packing/packing.service';
import { Beta0Model } from '../../../../../src/modules/refractory/enums/beta0-model.enum';
import { MaxPhiModel } from '../../../../../src/modules/refractory/enums/max-phi-model.enum';

describe('PackingService', () => {
  let service: PackingService;

  beforeEach(() => {
    service = new PackingService();
  });

  it('calculateCPM - happy path returns phi between 0 and maxPhi', () => {
    const inputs = {
      massFractions: [0.3, 0.4, 0.3],
      densities_kgm3: [3000, 3500, 2500],
      diameters_mm: [0.1, 0.5, 1.0],
      compactionPressure_MPa: 5,
    } as any;
    const res = service.calculateCPM(inputs);
    expect(res.packingFraction_phi).toBeGreaterThanOrEqual(0);
    expect(res.packingFraction_phi).toBeLessThanOrEqual(0.76); // DENSE_CASTABLE default
    expect(res.porosity_initial).toBeCloseTo(1 - res.packingFraction_phi, 3);
    expect(res.calibration).toBeDefined();
    expect(res.calibration.beta0).toBe(0.56); // ANGULAR default
    expect(res.calibration.maxPhi).toBe(0.76); // DENSE_CASTABLE default
  });

  it('calculateCPM - packing fraction changes when mass fractions change', () => {
    const densities_kgm3 = [3550, 3200];
    const diameters_mm = [4.5, 0.5];
    const coarseHeavy = service.calculateCPM({ massFractions: [0.7, 0.3], densities_kgm3, diameters_mm });
    const fineHeavy = service.calculateCPM({ massFractions: [0.3, 0.7], densities_kgm3, diameters_mm });
    expect(coarseHeavy.packingFraction_phi).not.toBe(fineHeavy.packingFraction_phi);
    expect(coarseHeavy.packingFraction_phi).toBeGreaterThan(0.56);
  });

  it('calculateCPM - micro-fillers raise packing above the no-filler plateau', () => {
    const densities_kgm3 = [2200, 3200, 2700, 2700, 2700];
    const withMicro = service.calculateCPM({
      massFractions: [0.12, 0.15, 0.2, 0.25, 0.28],
      densities_kgm3,
      diameters_mm: [0.02, 0.08, 0.2, 0.8, 3.0],
    });
    const withoutMicro = service.calculateCPM({
      massFractions: [0.2, 0.25, 0.25, 0.3],
      densities_kgm3: densities_kgm3.slice(1),
      diameters_mm: [0.15, 0.4, 0.8, 3.0],
    });
    expect(withMicro.composition.hasMicroFillers).toBe(true);
    expect(withMicro.composition.recommendedMaxPhi).toBeGreaterThanOrEqual(0.78);
    expect(withMicro.calibration.maxPhi).toBeGreaterThanOrEqual(0.78);
    expect(withMicro.calibration.beta0).toBeGreaterThan(0.56);
    expect(withMicro.packingFraction_phi).toBeGreaterThan(withoutMicro.packingFraction_phi);
    expect(withMicro.packingFraction_phi).toBeGreaterThanOrEqual(0.76);
  });

  it('calculateCPM - spherical model returns higher beta0', () => {
    const inputs = {
      massFractions: [0.5, 0.5],
      densities_kgm3: [3000, 3000],
      diameters_mm: [0.5, 1.0],
    } as any;
    const res = service.calculateCPM(inputs, {
      beta0Model: Beta0Model.SPHERICAL,
    });
    expect(res.calibration.beta0).toBe(0.64); // SPHERICAL
  });

  it('calculateCPM - legacy model preserves old behavior', () => {
    const inputs = {
      massFractions: [0.3, 0.4, 0.3],
      densities_kgm3: [3000, 3500, 2500],
      diameters_mm: [0.1, 0.5, 1.0],
    } as any;
    const res = service.calculateCPM(inputs, {
      beta0Model: Beta0Model.SPHERICAL,
      maxPhiModel: MaxPhiModel.LEGACY_CONSERVATIVE,
    });
    expect(res.calibration.beta0).toBe(0.64);
    expect(res.calibration.maxPhi).toBe(0.85);
    expect(res.packingFraction_phi).toBeLessThanOrEqual(0.85);
  });

  it('calculateCPM - custom calibration overrides models', () => {
    const inputs = {
      massFractions: [0.5, 0.5],
      densities_kgm3: [3000, 3000],
      diameters_mm: [0.5, 1.0],
    } as any;
    const res = service.calculateCPM(inputs, {
      beta0: 0.58,
      K: 10.5,
      maxPhi: 0.78,
      denomFloor: 0.02,
    });
    expect(res.calibration.beta0).toBe(0.58);
    expect(res.calibration.K).toBe(10.5);
    expect(res.calibration.maxPhi).toBe(0.78);
    expect(res.calibration.denomFloor).toBe(0.02);
  });

  it('calculateFurnas - happy path returns model Furnas', () => {
    const inputs = {
      massFractions: [0.2, 0.3, 0.5],
      densities_kgm3: [3000, 3500, 2500],
      diameters_mm: [0.05, 0.2, 1.5],
    } as any;
    const res = service.calculateFurnas(inputs);
    expect(res.model).toBe('Furnas');
    expect(res.packingFraction_phi).toBeGreaterThanOrEqual(0);
    expect(res.packingFraction_phi).toBeLessThanOrEqual(1);
  });
});
