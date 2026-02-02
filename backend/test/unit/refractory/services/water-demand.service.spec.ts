import { Test, TestingModule } from '@nestjs/testing';
import { WaterDemandService } from '../../../../src/modules/refractory/services/water-demand.service';
import { WorkabilityType } from '../../../../src/modules/refractory/enums/workability.enum';

describe('WaterDemandService', () => {
  let service: WaterDemandService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WaterDemandService],
    }).compile();

    service = module.get<WaterDemandService>(WaterDemandService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateWaterDemand', () => {
    it('should calculate water demand for standard workability', () => {
      // φ = 0.75 means 25% porosity
      const packingFraction = 0.75;
      const result = service.calculateWaterDemand(packingFraction, WorkabilityType.STANDARD);

      // Expected: 0.42 × (1 - 0.75) × 100 = 0.42 × 0.25 × 100 = 10.5%
      expect(result).toBeCloseTo(10.5, 1);
    });

    it('should calculate water demand for firm workability', () => {
      const packingFraction = 0.75;
      const result = service.calculateWaterDemand(packingFraction, WorkabilityType.FIRM);

      // Expected: 0.38 × (1 - 0.75) × 100 = 0.38 × 0.25 × 100 = 9.5%
      expect(result).toBeCloseTo(9.5, 1);
    });

    it('should calculate water demand for flowable workability', () => {
      const packingFraction = 0.75;
      const result = service.calculateWaterDemand(packingFraction, WorkabilityType.FLOWABLE);

      // Expected: 0.50 × (1 - 0.75) × 100 = 0.50 × 0.25 × 100 = 12.5%
      expect(result).toBeCloseTo(12.5, 1);
    });

    it('should use standard as default workability', () => {
      const packingFraction = 0.75;
      const resultDefault = service.calculateWaterDemand(packingFraction);
      const resultStandard = service.calculateWaterDemand(packingFraction, WorkabilityType.STANDARD);

      expect(resultDefault).toBe(resultStandard);
      expect(resultDefault).toBeCloseTo(10.5, 1);
    });

    it('should return water demand within 0-50% range for all packing values', () => {
      for (let phi = 0.5; phi <= 0.9; phi += 0.05) {
        const result = service.calculateWaterDemand(phi, WorkabilityType.STANDARD);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(50);
      }
    });

    it('should return properly formatted number with 1 decimal place', () => {
      const result = service.calculateWaterDemand(0.75, WorkabilityType.STANDARD);
      const decimalPlaces = (result.toString().split('.')[1] || '').length;
      expect(decimalPlaces).toBeLessThanOrEqual(1);
    });

    it('should show water demand increases with lower packing fraction (higher porosity)', () => {
      const densePackage = service.calculateWaterDemand(0.85, WorkabilityType.STANDARD); // 15% porosity
      const loosePackage = service.calculateWaterDemand(0.70, WorkabilityType.STANDARD); // 30% porosity

      expect(loosePackage).toBeGreaterThan(densePackage);
    });

    it('should scale proportionally with workability factors', () => {
      const packingFraction = 0.75;
      const firm = service.calculateWaterDemand(packingFraction, WorkabilityType.FIRM);
      const standard = service.calculateWaterDemand(packingFraction, WorkabilityType.STANDARD);
      const flowable = service.calculateWaterDemand(packingFraction, WorkabilityType.FLOWABLE);

      // firm < standard < flowable
      expect(firm).toBeLessThan(standard);
      expect(standard).toBeLessThan(flowable);

      // Ratios should match workability factors: 0.38:0.42:0.50
      const firmToStandard = firm / standard;
      const standardToFlowable = standard / flowable;

      expect(firmToStandard).toBeCloseTo(0.38 / 0.42, 2);
      expect(standardToFlowable).toBeCloseTo(0.42 / 0.50, 2);
    });

    it('should throw error for invalid packing fraction < 0', () => {
      expect(() => service.calculateWaterDemand(-0.1)).toThrow();
    });

    it('should throw error for invalid packing fraction > 1', () => {
      expect(() => service.calculateWaterDemand(1.1)).toThrow();
    });

    it('should handle edge case: very dense packing (φ near 1)', () => {
      const result = service.calculateWaterDemand(0.95, WorkabilityType.STANDARD);
      // Expected: 0.42 × (1 - 0.95) × 100 = 0.42 × 0.05 × 100 = 2.1%
      expect(result).toBeCloseTo(2.1, 1);
      expect(result).toBeGreaterThan(0);
    });

    it('should handle edge case: loose packing (φ near 0.5)', () => {
      const result = service.calculateWaterDemand(0.5, WorkabilityType.STANDARD);
      // Expected: 0.42 × (1 - 0.5) × 100 = 0.42 × 0.5 × 100 = 21%
      expect(result).toBeCloseTo(21, 1);
    });
  });

  describe('calculateWaterDemandRange', () => {
    it('should return min, typical, max water demand values', () => {
      const packingFraction = 0.75;
      const result = service.calculateWaterDemandRange(packingFraction);

      expect(result).toHaveProperty('min');
      expect(result).toHaveProperty('typical');
      expect(result).toHaveProperty('max');
      expect(typeof result.min).toBe('number');
      expect(typeof result.typical).toBe('number');
      expect(typeof result.max).toBe('number');
    });

    it('should have min <= typical <= max', () => {
      const packingFraction = 0.75;
      const result = service.calculateWaterDemandRange(packingFraction);

      expect(result.min).toBeLessThanOrEqual(result.typical);
      expect(result.typical).toBeLessThanOrEqual(result.max);
    });

    it('should calculate correct values for typical porosity (25%)', () => {
      const packingFraction = 0.75; // 25% porosity
      const result = service.calculateWaterDemandRange(packingFraction);

      expect(result.min).toBeCloseTo(9.5, 1);    // firm: 0.38 × 25
      expect(result.typical).toBeCloseTo(10.5, 1); // standard: 0.42 × 25
      expect(result.max).toBeCloseTo(12.5, 1);   // flowable: 0.50 × 25
    });

    it('should match individual workability calls', () => {
      const packingFraction = 0.68;
      const range = service.calculateWaterDemandRange(packingFraction);
      const firm = service.calculateWaterDemand(packingFraction, WorkabilityType.FIRM);
      const standard = service.calculateWaterDemand(packingFraction, WorkabilityType.STANDARD);
      const flowable = service.calculateWaterDemand(packingFraction, WorkabilityType.FLOWABLE);

      expect(range.min).toBe(firm);
      expect(range.typical).toBe(standard);
      expect(range.max).toBe(flowable);
    });

    it('should show range increases with lower packing fraction', () => {
      const dense = service.calculateWaterDemandRange(0.85);
      const loose = service.calculateWaterDemandRange(0.70);

      expect(loose.min).toBeGreaterThan(dense.min);
      expect(loose.typical).toBeGreaterThan(dense.typical);
      expect(loose.max).toBeGreaterThan(dense.max);
    });

    it('should provide useful range for design decisions', () => {
      const packingFraction = 0.76; // DENSE_CASTABLE default
      const result = service.calculateWaterDemandRange(packingFraction);

      // Range should be approximately 1-3% wide (feasible design window)
      const rangeWidth = result.max - result.min;
      expect(rangeWidth).toBeGreaterThan(1);
      expect(rangeWidth).toBeLessThan(4);
    });
  });

  describe('getWorkabilityFactor', () => {
    it('should return 0.38 for firm workability', () => {
      const factor = service.getWorkabilityFactor(WorkabilityType.FIRM);
      expect(factor).toBe(0.38);
    });

    it('should return 0.42 for standard workability', () => {
      const factor = service.getWorkabilityFactor(WorkabilityType.STANDARD);
      expect(factor).toBe(0.42);
    });

    it('should return 0.50 for flowable workability', () => {
      const factor = service.getWorkabilityFactor(WorkabilityType.FLOWABLE);
      expect(factor).toBe(0.50);
    });

    it('should have factors in ascending order', () => {
      const firm = service.getWorkabilityFactor(WorkabilityType.FIRM);
      const standard = service.getWorkabilityFactor(WorkabilityType.STANDARD);
      const flowable = service.getWorkabilityFactor(WorkabilityType.FLOWABLE);

      expect(firm).toBeLessThan(standard);
      expect(standard).toBeLessThan(flowable);
    });
  });

  describe('calculatePorosity', () => {
    it('should calculate porosity from packing fraction', () => {
      const result = service.calculatePorosity(0.75);
      // Expected: (1 - 0.75) × 100 = 25.0%
      expect(result).toBeCloseTo(25.0, 1);
    });

    it('should return 0 for perfect packing (φ = 1)', () => {
      const result = service.calculatePorosity(1.0);
      expect(result).toBe(0);
    });

    it('should return 100 for no packing (φ = 0)', () => {
      const result = service.calculatePorosity(0.0);
      expect(result).toBe(100);
    });

    it('should format to 1 decimal place', () => {
      const result = service.calculatePorosity(0.74);
      const decimalPlaces = (result.toString().split('.')[1] || '').length;
      expect(decimalPlaces).toBeLessThanOrEqual(1);
    });

    it('should range between 0-100%', () => {
      for (let phi = 0.0; phi <= 1.0; phi += 0.1) {
        const result = service.calculatePorosity(phi);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('validateWaterDemand', () => {
    it('should return true for valid water demand (10%)', () => {
      expect(service.validateWaterDemand(10)).toBe(true);
    });

    it('should return true for edge value 0', () => {
      expect(service.validateWaterDemand(0)).toBe(true);
    });

    it('should return true for edge value 50', () => {
      expect(service.validateWaterDemand(50)).toBe(true);
    });

    it('should return false for negative water demand', () => {
      expect(service.validateWaterDemand(-0.1)).toBe(false);
      expect(service.validateWaterDemand(-10)).toBe(false);
    });

    it('should return false for water demand > 50%', () => {
      expect(service.validateWaterDemand(50.1)).toBe(false);
      expect(service.validateWaterDemand(100)).toBe(false);
    });

    it('should accept all typical water demand values', () => {
      const typicalValues = [8, 9, 10, 11, 12, 13, 14, 15];
      for (const value of typicalValues) {
        expect(service.validateWaterDemand(value)).toBe(true);
      }
    });
  });

  describe('Water Demand - Porosity Relationship', () => {
    it('should demonstrate that water demand is NOT equal to porosity', () => {
      const packingFraction = 0.75;
      const porosity = service.calculatePorosity(packingFraction);
      const waterDemand = service.calculateWaterDemand(packingFraction, WorkabilityType.STANDARD);

      expect(waterDemand).not.toEqual(porosity);
      expect(waterDemand).toBeLessThan(porosity);
      expect(waterDemand).toBeCloseTo(porosity * 0.42, 1); // ~42% of porosity
    });

    it('should show water demand is 30-50% of porosity (workability dependent)', () => {
      const packingFraction = 0.75;
      const porosity = service.calculatePorosity(packingFraction);

      const firm = service.calculateWaterDemand(packingFraction, WorkabilityType.FIRM);
      const standard = service.calculateWaterDemand(packingFraction, WorkabilityType.STANDARD);
      const flowable = service.calculateWaterDemand(packingFraction, WorkabilityType.FLOWABLE);

      const firmPercent = (firm / porosity) * 100;
      const standardPercent = (standard / porosity) * 100;
      const flowablePercent = (flowable / porosity) * 100;

      expect(firmPercent).toBeCloseTo(38, 0);
      expect(standardPercent).toBeCloseTo(42, 0);
      expect(flowablePercent).toBeCloseTo(50, 0);
    });
  });

  describe('Real-world scenarios', () => {
    it('should calculate realistic water demand for high-alumina castable', () => {
      // Typical high-alumina: φ = 0.74 (26% porosity)
      const packingFraction = 0.74;
      const waterDemand = service.calculateWaterDemand(packingFraction, WorkabilityType.STANDARD);

      // Expected: 0.42 × 26% = 10.9%
      expect(waterDemand).toBeCloseTo(10.9, 1);
      // Typical range: 10-12%
      expect(waterDemand).toBeGreaterThanOrEqual(9);
      expect(waterDemand).toBeLessThanOrEqual(12);
    });

    it('should calculate realistic water demand for magnesia castable', () => {
      // Typical magnesia: φ = 0.78 (22% porosity)
      const packingFraction = 0.78;
      const waterDemand = service.calculateWaterDemand(packingFraction, WorkabilityType.STANDARD);

      // Expected: 0.42 × 22% = 9.2%
      expect(waterDemand).toBeCloseTo(9.2, 1);
      // Typical range: 8-10%
      expect(waterDemand).toBeGreaterThanOrEqual(8);
      expect(waterDemand).toBeLessThanOrEqual(10);
    });

    it('should calculate realistic water demand for ultra-dense castable', () => {
      // Ultra-dense with micro-fillers: φ = 0.80 (20% porosity)
      const packingFraction = 0.80;
      const waterDemand = service.calculateWaterDemand(packingFraction, WorkabilityType.STANDARD);

      // Expected: 0.42 × 20% = 8.4%
      expect(waterDemand).toBeCloseTo(8.4, 1);
      // Typical range: 7-9%
      expect(waterDemand).toBeGreaterThanOrEqual(7);
      expect(waterDemand).toBeLessThanOrEqual(9);
    });

    it('should show self-flowing castables need higher water demand', () => {
      const packingFraction = 0.73;
      const firm = service.calculateWaterDemand(packingFraction, WorkabilityType.FIRM);
      const flowable = service.calculateWaterDemand(packingFraction, WorkabilityType.FLOWABLE);

      // Self-flowing needs more water for mobility
      expect(flowable).toBeGreaterThan(firm);
      // Typical self-flowing: 12-14% water
      expect(flowable).toBeGreaterThanOrEqual(11);
      expect(flowable).toBeLessThanOrEqual(15);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle packing result from CPM', () => {
      // Typical CPM result: packingFraction = 0.74
      const packingResult = { packingFraction_phi: 0.74, porosity_percent_green: 26 };

      const waterDemand = service.calculateWaterDemand(packingResult.packingFraction_phi);
      const waterRange = service.calculateWaterDemandRange(packingResult.packingFraction_phi);

      expect(waterDemand).toBeCloseTo(10.9, 1);
      expect(waterRange.typical).toBeCloseTo(10.9, 1);
    });

    it('should provide options for different compaction scenarios', () => {
      // Self-compacting: φ = 0.73
      // Flowable: φ = 0.74
      // Vibratable: φ = 0.75
      // Hand-pressable: φ = 0.76

      const selfCompacting = service.calculateWaterDemand(0.73, WorkabilityType.STANDARD);
      const flowable = service.calculateWaterDemand(0.74, WorkabilityType.STANDARD);
      const vibratable = service.calculateWaterDemand(0.75, WorkabilityType.STANDARD);
      const handPressable = service.calculateWaterDemand(0.76, WorkabilityType.STANDARD);

      // Water demand decreases with increasing packing (better density)
      expect(selfCompacting).toBeGreaterThan(flowable);
      expect(flowable).toBeGreaterThan(vibratable);
      expect(vibratable).toBeGreaterThan(handPressable);
    });
  });
});

