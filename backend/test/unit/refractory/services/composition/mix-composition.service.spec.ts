import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MaterialCatalogService } from '../../../../../src/modules/refractory/services/catalog/material-catalog.service';
import { MixComponentCatalogService } from '../../../../../src/modules/refractory/services/catalog/mix-component-catalog.service';
import { MixCompositionService } from '../../../../../src/modules/refractory/services/composition/mix-composition.service';
import { CompositionBasis } from '../../../../../src/modules/refractory/enums/composition-basis.enum';
import { MaterialGroup } from '../../../../../src/modules/refractory/enums/material-group.enum';
import { MaterialType } from '../../../../../src/modules/refractory/enums/material-type.enum';
import { MaterialEntryDto } from '../../../../../src/modules/refractory/dto/material-catalog/material-entry.dto';

const sumValues = (values: object): number =>
  (Object.values(values) as Array<number | undefined>).reduce<number>((total, v) => total + (v ?? 0), 0);

/** Minimal library entry for rules that no real material exercises exactly. */
const stubMaterial = (composition: Record<string, number>): MaterialEntryDto => ({
  materialId: 'stub',
  name: 'Stub',
  type: MaterialType.AGGREGATE,
  materialGroup: [MaterialGroup.OXIDE],
  orderNumber: 1,
  description: '',
  composition,
  rho_true_after_firing_kgm3: 3000,
  chemicalShrinkage_volFrac: 0,
  activationEnergy_Jmol: 0,
  meltingPoint_C: 2000,
});

const serviceWithStub = (material: MaterialEntryDto): MixCompositionService =>
  new MixCompositionService({ getMixComponent: () => material } as unknown as MixComponentCatalogService);

describe('MixCompositionService', () => {
  let service: MixCompositionService;

  beforeEach(() => {
    service = new MixCompositionService(new MixComponentCatalogService(new MaterialCatalogService()));
  });

  describe('single material', () => {
    it('alumina_tabular - accepted oxides = its composition rescaled to the fired base', () => {
      const result = service.calculate({ fractions: [{ materialId: 'alumina_tabular', massFraction: 1 }] });
      const total = 99.5 + 0.1 + 0.1 + 0.1 + 0.2;
      expect(result.basis).toBe(CompositionBasis.FIRED);
      expect(result.lossOnIgnition_wt).toBe(0);
      expect(result.acceptedOxides_wt.Al2O3).toBeCloseTo((100 * 99.5) / total, 6);
      expect(result.trueDensity_kgm3).toBeCloseTo(3950, 6);
      expect(result.warnings).toEqual([]);
    });

    it('kaolinite - LOI 14, Al2O3 / SiO2 rescaled to 100', () => {
      const result = service.calculate({ fractions: [{ materialId: 'kaolinite', massFraction: 1 }] });
      expect(result.lossOnIgnition_wt).toBeCloseTo(14, 6);
      expect(result.acceptedOxides_wt.Al2O3).toBeCloseTo((100 * 39.5) / 86, 6);
      expect(result.acceptedOxides_wt.SiO2).toBeCloseTo((100 * 46.5) / 86, 6);
      expect(sumValues(result.acceptedOxides_normalized)).toBeCloseTo(100, 6);
    });

    it('titanium_carbide - carbide, TiO2, carbon, Fe dropped', () => {
      const result = service.calculate({ fractions: [{ materialId: 'titanium_carbide', massFraction: 1 }] });
      const firedBase = 98.5 + 0.8 + 0.4;
      expect(result.nonOxideComponents_wt.carbide).toBeCloseTo((100 * 98.5) / firedBase, 6);
      expect(result.acceptedOxides_wt.TiO2).toBeCloseTo((100 * 0.8) / firedBase, 6);
      expect(result.nonOxideComponents_wt.carbon).toBeCloseTo((100 * 0.4) / firedBase, 6);
      expect(result.droppedMetals_wt).toBeCloseTo((100 * 0.3) / firedBase, 6);
      expect(result.acceptedOxides_normalized).toEqual({ TiO2: 100 });
      expect(result.warnings).toHaveLength(1);
    });

    it('silicon_nitride - 100 % nitride, no accepted oxide', () => {
      const result = service.calculate({ fractions: [{ materialId: 'silicon_nitride', massFraction: 1 }] });
      expect(result.nonOxideComponents_wt.nitride).toBeCloseTo(100, 6);
      expect(result.acceptedOxides_wt).toEqual({});
      expect(result.acceptedOxides_normalized).toEqual({});
    });

    it('raku_clay - Grog is an "other" non-oxide and triggers the warning', () => {
      const result = service.calculate({ fractions: [{ materialId: 'raku_clay', massFraction: 1 }] });
      const firedBase = 24 + 50 + 4 + 3 + 2 + 15;
      expect(result.nonOxideComponents_wt.other).toBeCloseTo((100 * 15) / firedBase, 6);
      expect(result.warnings).toHaveLength(1);
    });

    it('cement_pc - SO3 is an other oxide', () => {
      const result = service.calculate({ fractions: [{ materialId: 'cement_pc', massFraction: 1 }] });
      expect(Object.keys(result.otherOxides_wt)).toEqual(['SO3']);
    });
  });

  describe('mixing', () => {
    it('repeated rows add up like one row', () => {
      const split = service.calculate({
        fractions: [
          { materialId: 'alumina_tabular', massFraction: 0.3 },
          { materialId: 'alumina_tabular', massFraction: 0.2 },
          { materialId: 'kaolinite', massFraction: 0.5 },
        ],
      });
      const merged = service.calculate({
        fractions: [
          { materialId: 'alumina_tabular', massFraction: 0.5 },
          { materialId: 'kaolinite', massFraction: 0.5 },
        ],
      });
      expect(split.acceptedOxides_wt.Al2O3).toBeCloseTo(merged.acceptedOxides_wt.Al2O3!, 9);
      expect(split.trueDensity_kgm3).toBeCloseTo(merged.trueDensity_kgm3, 9);
    });

    it('fractions not summing to 1 are rescaled', () => {
      const scaled = service.calculate({
        fractions: [
          { materialId: 'alumina_tabular', massFraction: 0.2 },
          { materialId: 'kaolinite', massFraction: 0.2 },
        ],
      });
      const unit = service.calculate({
        fractions: [
          { materialId: 'alumina_tabular', massFraction: 0.5 },
          { materialId: 'kaolinite', massFraction: 0.5 },
        ],
      });
      expect(scaled).toEqual(unit);
    });

    it('true density of a two-material mix = 1 / Σ(w′ / ρ) on fired mass', () => {
      const result = service.calculate({
        fractions: [
          { materialId: 'alumina_tabular', massFraction: 0.5 },
          { materialId: 'kaolinite', massFraction: 0.5 },
        ],
      });
      const firedAlumina = 0.5 * 100;
      const firedKaolinite = 0.5 * (100 - 14);
      const total = firedAlumina + firedKaolinite;
      const expected = 1 / (firedAlumina / total / 3950 + firedKaolinite / total / 2600);
      expect(result.trueDensity_kgm3).toBeCloseTo(expected, 6);
    });

    it('binder + oxide + silicate + clay + carbide + nitride in one mix', () => {
      const result = service.calculate({
        fractions: [
          { materialId: 'cement_pc', massFraction: 0.1 },
          { materialId: 'alumina_tabular', massFraction: 0.4 },
          { materialId: 'chamotte_standard', massFraction: 0.2 },
          { materialId: 'kaolinite', massFraction: 0.1 },
          { materialId: 'silicon_carbide', massFraction: 0.1 },
          { materialId: 'silicon_nitride', massFraction: 0.1 },
        ],
      });
      const firedTotal =
        sumValues(result.acceptedOxides_wt) +
        sumValues(result.otherOxides_wt) +
        sumValues(result.nonOxideComponents_wt);
      expect(firedTotal).toBeCloseTo(100, 6);
      expect(result.nonOxideComponents_wt.carbide).toBeGreaterThan(0);
      expect(result.nonOxideComponents_wt.nitride).toBeGreaterThan(0);
      expect(sumValues(result.acceptedOxides_normalized)).toBeCloseTo(100, 6);
    });
  });

  describe('reliability warning threshold', () => {
    it('exactly 5 % outside the accepted oxides - no warning', () => {
      const result = serviceWithStub(stubMaterial({ Al2O3: 95, B2O3: 5 }))
        .calculate({ fractions: [{ materialId: 'stub', massFraction: 1 }] });
      expect(result.warnings).toEqual([]);
    });

    it('above 5 % - one warning', () => {
      const result = serviceWithStub(stubMaterial({ Al2O3: 94.9, B2O3: 5.1 }))
        .calculate({ fractions: [{ materialId: 'stub', massFraction: 1 }] });
      expect(result.warnings).toHaveLength(1);
    });
  });

  describe('errors', () => {
    it('Σ massFraction = 0 - throws BadRequestException', () => {
      expect(() => service.calculate({ fractions: [{ materialId: 'alumina_tabular', massFraction: 0 }] }))
        .toThrow(BadRequestException);
    });

    it.each(['paper_clay', 'soda_lime_glass', 'calcium_fluoride'])('%s - throws BadRequestException', id => {
      expect(() => service.calculate({ fractions: [{ materialId: id, massFraction: 1 }] }))
        .toThrow(BadRequestException);
    });

    it.each(['unknown_material', 'chamotte_solid'])('%s - throws NotFoundException', id => {
      expect(() => service.calculate({ fractions: [{ materialId: id, massFraction: 1 }] }))
        .toThrow(NotFoundException);
    });
  });
});
