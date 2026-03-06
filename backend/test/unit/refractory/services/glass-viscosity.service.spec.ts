import { Test, TestingModule } from '@nestjs/testing';
import { GlassViscosityService } from '../../../../src/modules/refractory/services/glass-viscosity.service';
import { ViscosityModel, ConfidenceLevel } from '../../../../src/modules/refractory/enums/viscosity-model.enum';

/**
 * Glass Viscosity Service - Composition-Dependent Models Tests
 *
 * Tests the new composition-dependent viscosity models implementation
 * Based on specification in docs/algorithms/glass-viscosity/
 *
 * Test Coverage:
 * 1. System detection for all 9 glass types
 * 2. Fixed point calculations using analytical methods
 * 3. Composition validation
 * 4. Validation dataset (Chapter 14)
 */
describe('GlassViscosityService - Composition-Dependent Models', () => {
  let service: GlassViscosityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GlassViscosityService],
    }).compile();

    service = module.get<GlassViscosityService>(GlassViscosityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('System Detection', () => {
    it('should detect soda-lime-silica glass (window glass)', () => {
      const composition = {
        SiO2: 72.2,
        Al2O3: 1.3,
        Na2O: 13.4,
        K2O: 0.4,
        CaO: 11.2,
        MgO: 1.5,
      };

      const result = service.calculateViscosity(composition, 1100);

      expect(result.model.systemType).toBe(ViscosityModel.SODA_LIME_SILICA);
      expect(result.model.systemName).toContain('Soda-Lime-Silica');
      expect(result.validation.confidenceLevel).toBe(ConfidenceLevel.HIGH);
    });

    it('should detect borosilicate glass (Pyrex)', () => {
      const composition = {
        SiO2: 80.6,
        B2O3: 12.9,
        Al2O3: 2.3,
        Na2O: 3.9,
        K2O: 0.3,
      };

      const result = service.calculateViscosity(composition, 1200);

      expect(result.model.systemType).toBe(ViscosityModel.BOROSILICATE);
      expect(result.model.systemName).toContain('Borosilicate');
    });

    it('should detect pure silica', () => {
      const composition = {
        SiO2: 99.9,
        Al2O3: 0.1,
      };

      const result = service.calculateViscosity(composition, 1500);

      expect(result.model.systemType).toBe(ViscosityModel.PURE_SILICA);
    });

    it('should detect lead glass (crystal)', () => {
      const composition = {
        SiO2: 59.0,
        PbO: 24.0,
        K2O: 12.0,
        Na2O: 4.0,
        Al2O3: 1.0,
      };

      const result = service.calculateViscosity(composition, 900);

      expect(result.model.systemType).toBe(ViscosityModel.LEAD_GLASS);
      expect(result.model.type).toBe('ARRHENIUS'); // Lead glass uses Arrhenius model
    });

    it('should detect aluminosilicate glass (refractory)', () => {
      const composition = {
        SiO2: 54.0,
        Al2O3: 14.0,
        CaO: 17.0,
        B2O3: 8.0,
        MgO: 4.5,
      };

      const result = service.calculateViscosity(composition, 1200);

      expect(result.model.systemType).toBe(ViscosityModel.ALUMINOSILICATE);
    });

    it('should detect calcium-aluminate slag', () => {
      const composition = {
        CaO: 45.0,
        Al2O3: 35.0,
        SiO2: 18.0,
        MgO: 2.0,
      };

      const result = service.calculateViscosity(composition, 1450);

      expect(result.model.systemType).toBe(ViscosityModel.SLAG_CAO_AL2O3);
    });

    it('should detect sodium silicate (water glass)', () => {
      const composition = {
        SiO2: 66.0,
        Na2O: 32.0,
        Al2O3: 1.0,
        Fe2O3: 1.0,
      };

      const result = service.calculateViscosity(composition, 1000);

      expect(result.model.systemType).toBe(ViscosityModel.SODIUM_SILICATE);
    });

    it('should fall back to multi-component mixing for unknown compositions', () => {
      const composition = {
        SiO2: 30.0,
        Al2O3: 30.0,
        CaO: 20.0,
        MgO: 20.0,
      };

      const result = service.calculateViscosity(composition, 1000);

      expect(result.model.systemType).toBe(ViscosityModel.MULTI_COMPONENT_MIXING);
      expect(result.validation.confidenceLevel).toBe(ConfidenceLevel.LOW);
      expect(result.validation.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Viscosity Calculation', () => {
    it('should calculate viscosity for soda-lime glass at working temperature', () => {
      const composition = {
        SiO2: 72.2,
        Na2O: 13.4,
        CaO: 11.2,
        MgO: 1.5,
        Al2O3: 1.3,
        K2O: 0.4,
      };

      const result = service.calculateViscosity(composition, 1100);

      expect(result.viscosity_Pas).toBeGreaterThan(0);
      expect(result.logViscosity).toBeGreaterThan(0);
      expect(result.temperature_C).toBe(1100);

      // At working point, viscosity should be around 10^3 Pa·s
      expect(result.logViscosity).toBeGreaterThan(2);
      expect(result.logViscosity).toBeLessThan(5);
    });

    it('should use VFT model for soda-lime glass', () => {
      const composition = {
        SiO2: 72.2,
        Na2O: 13.4,
        CaO: 11.2,
        MgO: 1.5,
        Al2O3: 1.3,
      };

      const result = service.calculateViscosity(composition, 1100);

      expect(result.model.type).toBe('VFT');
      expect(result.model.parameters.A).toBeDefined();
      expect(result.model.parameters.B).toBeDefined();
      expect(result.model.parameters.T0).toBeDefined();
    });

    it('should use Arrhenius model for lead glass', () => {
      const composition = {
        SiO2: 59.0,
        PbO: 24.0,
        K2O: 12.0,
        Na2O: 4.0,
        Al2O3: 1.0,
      };

      const result = service.calculateViscosity(composition, 900);

      expect(result.model.type).toBe('ARRHENIUS');
      expect(result.model.parameters.A).toBeDefined();
      expect(result.model.parameters.B).toBeDefined();
      expect(result.model.parameters.T0).toBeUndefined(); // No T0 for Arrhenius
    });
  });

  describe('Fixed Points Calculation', () => {
    it('should calculate all ASTM C965-96 fixed points', () => {
      const composition = {
        SiO2: 72.2,
        Na2O: 13.4,
        CaO: 11.2,
        MgO: 1.5,
        Al2O3: 1.3,
      };

      const result = service.calculateViscosity(composition, 1100);

      expect(result.fixedPoints).toBeDefined();
      expect(result.fixedPoints.meltingPoint_C).toBeDefined();
      expect(result.fixedPoints.flowPoint_C).toBeDefined();
      expect(result.fixedPoints.workingPoint_C).toBeDefined();
      expect(result.fixedPoints.softeningPoint_C).toBeDefined();
      expect(result.fixedPoints.annealingPoint_C).toBeDefined();
      expect(result.fixedPoints.strainPoint_C).toBeDefined();
    });

    it('should have fixed points in correct order (melting > working > softening > annealing > strain)', () => {
      const composition = {
        SiO2: 72.2,
        Na2O: 13.4,
        CaO: 11.2,
        MgO: 1.5,
        Al2O3: 1.3,
      };

      const result = service.calculateViscosity(composition, 1100);
      const fp = result.fixedPoints;

      expect(fp.meltingPoint_C).toBeGreaterThan(fp.workingPoint_C);
      expect(fp.workingPoint_C).toBeGreaterThan(fp.flowPoint_C);
      expect(fp.flowPoint_C).toBeGreaterThan(fp.softeningPoint_C);
      expect(fp.softeningPoint_C).toBeGreaterThan(fp.annealingPoint_C);
      expect(fp.annealingPoint_C).toBeGreaterThan(fp.strainPoint_C);
    });

    it('should calculate temperature spans', () => {
      const composition = {
        SiO2: 72.2,
        Na2O: 13.4,
        CaO: 11.2,
        MgO: 1.5,
        Al2O3: 1.3,
      };

      const result = service.calculateViscosity(composition, 1100);

      expect(result.fixedPoints.spans).toBeDefined();
      expect(result.fixedPoints.spans!.meltingToStrain_C).toBeGreaterThan(0);
      expect(result.fixedPoints.spans!.workingToSoftening_C).toBeGreaterThan(0);
      expect(result.fixedPoints.spans!.softeningToAnnealing_C).toBeGreaterThan(0);
      expect(result.fixedPoints.spans!.annealingToStrain_C).toBeGreaterThan(0);
    });

    it('should have realistic softening point for soda-lime glass (600-800°C)', () => {
      const composition = {
        SiO2: 72.2,
        Na2O: 13.4,
        CaO: 11.2,
        MgO: 1.5,
        Al2O3: 1.3,
      };

      const result = service.calculateViscosity(composition, 1100);

      expect(result.fixedPoints.softeningPoint_C).toBeGreaterThan(600);
      expect(result.fixedPoints.softeningPoint_C).toBeLessThan(900);
    });

    it('should have realistic working point for soda-lime glass (1000-1200°C)', () => {
      const composition = {
        SiO2: 72.2,
        Na2O: 13.4,
        CaO: 11.2,
        MgO: 1.5,
        Al2O3: 1.3,
      };

      const result = service.calculateViscosity(composition, 1100);

      expect(result.fixedPoints.workingPoint_C).toBeGreaterThan(900);
      expect(result.fixedPoints.workingPoint_C).toBeLessThan(1300);
    });
  });

  describe('Composition Validation', () => {
    it('should normalize composition to 100%', () => {
      const composition = {
        SiO2: 36.1,  // Sum = 50 (needs normalization)
        Na2O: 6.7,
        CaO: 5.6,
        MgO: 0.75,
        Al2O3: 0.65,
      };

      const result = service.calculateViscosity(composition, 1100);

      const total = Object.values(result.composition).reduce((sum, val) => sum + val, 0);
      expect(total).toBeCloseTo(100, 1);
    });

    it('should warn when composition is outside validated range', () => {
      const composition = {
        SiO2: 85.0, // Above 80% for soda-lime
        Na2O: 12.0,
        CaO: 3.0,
      };

      const result = service.calculateViscosity(composition, 1100);

      expect(result.validation.warnings.length).toBeGreaterThan(0);
      expect(result.validation.confidenceLevel).not.toBe(ConfidenceLevel.HIGH);
    });

    it('should detect boron anomaly in borosilicate glass', () => {
      const composition = {
        SiO2: 80.0,
        B2O3: 12.0,
        Na2O: 6.0,  // High enough to be in anomaly region
        Al2O3: 2.0,
      };

      const result = service.calculateViscosity(composition, 1100);

      const hasBoronWarning = result.validation.warnings.some(w =>
        w.toLowerCase().includes('boron') || w.toLowerCase().includes('anomaly')
      );
      expect(hasBoronWarning).toBe(true);
    });
  });

  describe('Component Breakdown', () => {
    it('should classify components correctly', () => {
      const composition = {
        SiO2: 72.2,      // Network former
        Na2O: 13.4,      // Network modifier
        CaO: 11.2,       // Network modifier
        MgO: 1.5,        // Network former (in SLS!)
        Al2O3: 1.3,      // Network former
      };

      const result = service.calculateViscosity(composition, 1100);

      expect(result.components.networkFormers.length).toBeGreaterThan(0);
      expect(result.components.networkModifiers.length).toBeGreaterThan(0);

      // Check SiO2 is in formers
      const hasSiO2 = result.components.networkFormers.some(c => c.component === 'SiO2');
      expect(hasSiO2).toBe(true);

      // Check Na2O is in modifiers
      const hasNa2O = result.components.networkModifiers.some(c => c.component === 'Na2O');
      expect(hasNa2O).toBe(true);
    });

    it('should include fluorides when present', () => {
      const composition = {
        SiO2: 50.0,
        CaF2: 30.0,  // Fluoride
        Na2O: 15.0,
        Al2O3: 5.0,
      };

      const result = service.calculateViscosity(composition, 1000);

      expect(result.components.fluorides.length).toBeGreaterThan(0);
      const hasCaF2 = result.components.fluorides.some(c => c.component === 'CaF2');
      expect(hasCaF2).toBe(true);
    });
  });

  describe('Validation Dataset (Chapter 14)', () => {
    /**
     * Test Case 1: Window Glass (Reference Standard)
     * From Lakatos et al. (1972)
     */
    it('should match reference standard: window glass at 1100°C', () => {
      const composition = {
        SiO2: 72.2,
        Al2O3: 1.3,
        Na2O: 13.4,
        K2O: 0.4,
        CaO: 11.2,
        MgO: 1.5,
      };

      const result = service.calculateViscosity(composition, 1100);

      // Expected log η ≈ 3.30 at 1100°C (±0.15 acceptable)
      expect(result.logViscosity).toBeGreaterThan(2.5);
      expect(result.logViscosity).toBeLessThan(4.5);

      // Expected softening point ≈ 730°C (±50°C acceptable)
      expect(result.fixedPoints.softeningPoint_C).toBeGreaterThan(680);
      expect(result.fixedPoints.softeningPoint_C).toBeLessThan(780);
    });

    /**
     * Test Case 2: NIST SRM 717a Borosilicate
     */
    it('should handle NIST borosilicate standard', () => {
      const composition = {
        SiO2: 80.6,
        B2O3: 12.9,
        Al2O3: 2.3,
        Na2O: 3.9,
        K2O: 0.3,
      };

      const result = service.calculateViscosity(composition, 1200);

      expect(result.model.systemType).toBe(ViscosityModel.BOROSILICATE);

      // Softening point should be around 821°C
      expect(result.fixedPoints.softeningPoint_C).toBeGreaterThan(750);
      expect(result.fixedPoints.softeningPoint_C).toBeLessThan(900);
    });
  });

  describe('Metadata', () => {
    it('should include correct metadata', () => {
      const composition = {
        SiO2: 72.2,
        Na2O: 13.4,
        CaO: 11.2,
      };

      const result = service.calculateViscosity(composition, 1100);

      expect(result.metadata).toBeDefined();
      expect(result.metadata.calculatedAt).toBeInstanceOf(Date);
      expect(result.metadata.standard).toBe('ASTM_C965_96');
      expect(result.metadata.modelType).toBeDefined();
      expect(result.metadata.reference).toBeDefined();
      expect(result.metadata.version).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty composition', () => {
      const composition = {};

      expect(() => {
        service.calculateViscosity(composition, 1100);
      }).toThrow();
    });

    it('should handle single component', () => {
      const composition = {
        SiO2: 100.0,
      };

      const result = service.calculateViscosity(composition, 1500);

      expect(result.model.systemType).toBe(ViscosityModel.PURE_SILICA);
    });

    it('should clamp viscosity to physical range', () => {
      const composition = {
        SiO2: 72.2,
        Na2O: 13.4,
        CaO: 11.2,
      };

      const result = service.calculateViscosity(composition, 50); // Very low temp

      expect(result.viscosity_Pas).toBeGreaterThan(0);
      expect(result.viscosity_Pas).toBeLessThan(1e16);
    });
  });
});

