import { PackingService } from '../../../../src/modules/refractory/services/packing.service';
import { Beta0Model, MaxPhiModel } from '../../../../src/modules/refractory/enums/packing-models.enum';

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
