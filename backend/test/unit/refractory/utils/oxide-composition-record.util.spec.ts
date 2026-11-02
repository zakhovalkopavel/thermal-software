import { plainToInstance } from 'class-transformer';
import { OxideCompositionDto } from '../../../../src/modules/refractory/dto/common/common.dto';
import { PhaseEquilibriumService } from '../../../../src/modules/refractory/services/composition/phase-equilibrium.service';
import { toOxideCompositionRecord } from '../../../../src/modules/refractory/utils/oxide-composition-record.util';

const dto = (body: Record<string, number>) => plainToInstance(OxideCompositionDto, body);

describe('toOxideCompositionRecord', () => {
  it('drops oxides omitted from the request (DTO fields are undefined on the instance)', () => {
    const composition = dto({ Al2O3: 45, SiO2: 55 });
    expect(Object.keys(composition)).toEqual(expect.arrayContaining(['CaO', 'MgO']));
    expect(toOxideCompositionRecord(composition)).toEqual({ Al2O3: 45, SiO2: 55 });
  });

  it('keeps zero values', () => {
    expect(toOxideCompositionRecord(dto({ SiO2: 100, CaO: 0 }))).toEqual({ SiO2: 100, CaO: 0 });
  });

  describe('phase equilibrium with a transformed request', () => {
    const service = new PhaseEquilibriumService();
    const composition = toOxideCompositionRecord(dto({ Al2O3: 45, SiO2: 48, CaO: 1.5, Fe2O3: 3.5, MgO: 0.8, TiO2: 1.2 }));

    it.each([1000, 1600])('at %d °C (all solid / all liquid) - returns rounded compositions', (temperature) => {
      const result = service.calculatePhaseEquilibrium({ composition, temperature });
      const values = [...Object.values(result.liquid.composition), ...Object.values(result.solid.composition)];
      expect(values.length).toBeGreaterThan(0);
      values.forEach((value) => expect(Number.isFinite(value)).toBe(true));
    });

    it('rejects a composition that does not sum to ~100 %', () => {
      expect(() =>
        service.calculatePhaseEquilibrium({ composition: toOxideCompositionRecord(dto({ Al2O3: 40 })), temperature: 1200 }),
      ).toThrow('Composition must sum to ~100%');
    });
  });
});
