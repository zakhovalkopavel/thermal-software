import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AlgorithmMode } from '../../../../../src/modules/refractory/enums/algorithm-mode.enum';
import { LegacyVariant } from '../../../../../src/modules/refractory/enums/legacy-variant.enum';
import { PhaseEquilibriumMethod } from '../../../../../src/modules/refractory/enums/phase-equilibrium-method.enum';
import { PhaseEquilibriumInputDto } from '../../../../../src/modules/refractory/dto/phase-equilibrium/phase-equilibrium-input.dto';
import { MaterialCatalogService } from '../../../../../src/modules/refractory/services/catalog/material-catalog.service';
import { MixComponentCatalogService } from '../../../../../src/modules/refractory/services/catalog/mix-component-catalog.service';
import { GlassViscosityService } from '../../../../../src/modules/refractory/services/composition/glass-viscosity.service';
import { PhaseEquilibriumService } from '../../../../../src/modules/refractory/services/composition/phase-equilibrium.service';
import { PhaseEquilibriumCalphadService } from '../../../../../src/modules/refractory/services/composition/phase-equilibrium-calphad.service';
import { PhaseEquilibriumLegacyDiagramService } from '../../../../../src/modules/refractory/services/composition/phase-equilibrium-legacy-diagram.service';
import { PhaseEquilibriumLegacyEutecticService } from '../../../../../src/modules/refractory/services/composition/phase-equilibrium-legacy-eutectic.service';

const SLAG_VISCOSITY = {
  viscosity_Pas: 12.5,
  logViscosity_Pas: 1.097,
  temperature_C: 1500,
  liquidusTemperature_C: 1400,
  thermalState: 'ABOVE_LIQUIDUS',
  model: 'IIDA',
  warnings: [],
};

/** Alumina + calcium aluminate cement: the coarse alumina stays largely unreacted. */
const aluminaCac = (overrides: Partial<PhaseEquilibriumInputDto> = {}): PhaseEquilibriumInputDto => ({
  fractions: [
    { materialId: 'alumina_tabular', d50_mm: 4, massFraction: 0.7 },
    { materialId: 'cac_ca70', d50_mm: 0.015, massFraction: 0.3 },
  ],
  temperature: 1500,
  ...overrides,
});

describe('PhaseEquilibriumService (orchestrator)', () => {
  let service: PhaseEquilibriumService;
  let calculateViscosity: jest.Mock;

  beforeEach(() => {
    calculateViscosity = jest.fn().mockReturnValue(SLAG_VISCOSITY);
    service = new PhaseEquilibriumService(
      new MixComponentCatalogService(new MaterialCatalogService()),
      new PhaseEquilibriumCalphadService(),
      new PhaseEquilibriumLegacyEutecticService(),
      new PhaseEquilibriumLegacyDiagramService(),
      { calculateViscosity } as unknown as GlassViscosityService,
    );
  });

  describe('calphad mode (default)', () => {
    it('returns the response shape with metadata', () => {
      const res = service.calculate(aluminaCac({ totalMass: 1000, holdTime_hours: 3 }));
      expect(res.metadata).toEqual(
        expect.objectContaining({
          engine: AlgorithmMode.CALPHAD,
          method: expect.stringMatching(/^(eutectic_anchored|calphad_partial_excess|tm_estimate)$/),
          temperature: 1500,
          holdTime_hours: 3,
          totalMass: 1000,
          calculatedAt: expect.any(Date),
        }),
      );
      expect(res.metadata.reactedPercent).toBeGreaterThan(0);
      expect(res.metadata.comparison).toBeUndefined();
      expect(res.matrix.system).toContain('Al2O3');
      expect(res.afterCooling.crystals).toEqual(res.atTemperature.crystals);
    });

    it('accounts for 100 % of the fired body (liquid + glass + crystals)', () => {
      const res = service.calculate(aluminaCac());
      const total =
        res.atTemperature.liquid.percent +
        res.atTemperature.glass.percent +
        res.atTemperature.crystals.reduce((sum, c) => sum + c.percent, 0);
      expect(total).toBeCloseTo(100, 0);
      const quenched = res.afterCooling.glass.percent + res.afterCooling.crystals.reduce((sum, c) => sum + c.percent, 0);
      expect(quenched).toBeCloseTo(100, 0);
    });

    it('scales masses by totalMass', () => {
      const res = service.calculate(aluminaCac({ totalMass: 1000 }));
      expect(res.atTemperature.liquid.mass).toBeCloseTo(res.atTemperature.liquid.percent * 10, 1);
      const corundum = res.atTemperature.crystals.find(c => c.phaseId === 'corundum');
      expect(corundum.mass).toBeCloseTo(corundum.percent * 10, 0);
    });

    it('reports the grain reaction per fraction: coarse grains react partly, fine cement fully', () => {
      const res = service.calculate(aluminaCac());
      const [coarse, fine] = res.fractions;
      expect(coarse.reactedPercent).toBeGreaterThan(0);
      expect(coarse.reactedPercent).toBeLessThan(100);
      expect(fine.reactedPercent).toBe(100);
      expect(coarse.penetrationDepth_mm).toBeGreaterThan(0);
    });

    it('keeps the unreacted alumina core as corundum with origin tracking', () => {
      const res = service.calculate(aluminaCac());
      const corundum = res.unreactedOriginalPhases.find(p => p.materialId === 'alumina_tabular' && p.phaseId === 'corundum');
      expect(corundum.unreactedShare).toBeGreaterThan(0);
      expect(corundum.unreactedShare).toBeLessThan(100);
      expect(corundum.state).toBe('unchanged');
      const crystal = res.atTemperature.crystals.find(c => c.phaseId === 'corundum');
      expect(crystal.origin.unreactedUnchanged).toBeCloseTo(corundum.unreactedPercent, 1);
    });

    it('attaches the melt viscosity of the matrix liquid when a model applies', () => {
      const res = service.calculate(aluminaCac({ temperature: 1800 }));
      expect(res.atTemperature.liquid.parts[0].viscosity).toEqual(
        expect.objectContaining({ model: 'IIDA', logViscosity: 1.097, viscosity_Pas: 12.5 }),
      );
    });

    it('attaches viscosity to unreacted amorphous cores', () => {
      const res = service.calculate({
        fractions: [{ materialId: 'chamotte_standard', d50_mm: 2, massFraction: 1 }],
        temperature: 1500,
        holdTime_hours: 2,
      });
      const glassPart = res.atTemperature.glass.parts.find(p => p.source === 'unreacted');
      expect(glassPart).toBeDefined();
      expect(glassPart.viscosity).toEqual(
        expect.objectContaining({ model: 'IIDA', logViscosity: 1.097, viscosity_Pas: 12.5 }),
      );
      expect(calculateViscosity).toHaveBeenCalled();
    });

    it('only warns when the viscosity model fails', () => {
      calculateViscosity.mockImplementation(() => {
        throw new BadRequestException('outside all models');
      });
      const res = service.calculate(aluminaCac({ temperature: 1800 }));
      expect(res.atTemperature.liquid.parts[0].viscosity).toBeNull();
      expect(res.warnings.some(w => w.includes('viscosity not available'))).toBe(true);
    });

    it('keeps inert phases (SiC) unreacted and warns', () => {
      const res = service.calculate({
        fractions: [{ materialId: 'silicon_carbide', d50_mm: 0.5, massFraction: 1 }],
        temperature: 1450,
      });
      expect(res.atTemperature.crystals.find(c => c.phaseId === 'sic').percent).toBeGreaterThan(90);
      expect(res.warnings.some(w => w.includes('Inert phases'))).toBe(true);
    });
  });

  describe('legacy mode', () => {
    it('runs the legacy eutectic model on the matrix', () => {
      const res = service.calculate(aluminaCac({ algorithmMode: AlgorithmMode.LEGACY }));
      expect(res.metadata.engine).toBe(AlgorithmMode.LEGACY);
      expect(res.metadata.method).toBe(PhaseEquilibriumMethod.LEGACY_EUTECTIC);
    });

    it('rejects the diagram variant until datasets are validated', () => {
      expect(() =>
        service.calculate(aluminaCac({ algorithmMode: AlgorithmMode.LEGACY, legacyVariant: LegacyVariant.DIAGRAM })),
      ).toThrow('legacyDiagram is not available');
    });
  });

  describe('compare mode', () => {
    it('fills metadata.comparison with the liquid delta and phase id sets', () => {
      const res = service.calculate(aluminaCac({ algorithmMode: AlgorithmMode.COMPARE }));
      const comparison = res.metadata.comparison;
      expect([
        PhaseEquilibriumMethod.EUTECTIC_ANCHORED,
        PhaseEquilibriumMethod.CALPHAD_PARTIAL_EXCESS,
        PhaseEquilibriumMethod.TM_ESTIMATE,
      ]).toContain(res.metadata.method);
      expect(comparison.legacyVariant).toBe(LegacyVariant.EUTECTIC);
      expect(comparison.liquidPercentDelta).toBeCloseTo(comparison.legacyLiquidPercent - comparison.calphadLiquidPercent, 1);
      expect(comparison.calphadPhaseIds).toContain('corundum');
      expect(comparison.commonPhaseIds).toContain('corundum');
    });

    it('skips an unavailable legacy diagram instead of failing', () => {
      const res = service.calculate(
        aluminaCac({ algorithmMode: AlgorithmMode.COMPARE, legacyVariant: LegacyVariant.DIAGRAM }),
      );
      expect(res.metadata.comparison.legacyLiquidPercent).toBeNull();
      expect(res.metadata.comparison.legacyUnavailableReason).toContain('legacyDiagram');
      expect(res.warnings.some(w => w.includes('skipped in compare mode'))).toBe(true);
    });
  });

  describe('validation', () => {
    it('rejects a zero total mass fraction', () => {
      expect(() =>
        service.calculate(aluminaCac({ fractions: [{ materialId: 'alumina_tabular', d50_mm: 1, massFraction: 0 }] })),
      ).toThrow(BadRequestException);
    });

    it('404 for an unknown material', () => {
      expect(() =>
        service.calculate(aluminaCac({ fractions: [{ materialId: 'no_such_material', d50_mm: 1, massFraction: 1 }] })),
      ).toThrow(NotFoundException);
    });
  });
});
