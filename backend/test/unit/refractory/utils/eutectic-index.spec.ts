import { EutecticIndex } from '../../../../src/modules/refractory/utils/eutectic-index';
import type { EutecticEntry } from '../../../../src/modules/refractory/types/eutectic-entry.type';

const entry = (components: string[], composition_mol: number[] | null): EutecticEntry => ({
  entry: 0,
  system: components.join('-'),
  components,
  composition_mol,
  temperature_C: 1000,
  uncertainty_C: null,
  approximateComposition: false,
  approximateTemperature: false,
  references: [],
  notes: [],
});

describe('EutecticIndex', () => {
  afterEach(() => EutecticIndex.resetCache());

  describe('loadEntries', () => {
    it('keeps only oxide / fluoride systems with composition and temperature', () => {
      const entries = EutecticIndex.loadEntries();
      expect(entries.length).toBeGreaterThan(0);
      for (const e of entries) {
        expect(e.components.length).toBeGreaterThanOrEqual(2);
        expect(e.components.every(c => EutecticIndex.looksLikeOxideOrFluoride(c))).toBe(true);
        expect(e.composition_mol).toHaveLength(e.components.length);
        expect(typeof e.temperature_C).toBe('number');
      }
    });

    it('caches the entries until resetCache', () => {
      const first = EutecticIndex.loadEntries();
      expect(EutecticIndex.loadEntries()).toBe(first);
      EutecticIndex.resetCache();
      expect(EutecticIndex.loadEntries()).not.toBe(first);
    });
  });

  describe('looksLikeOxideOrFluoride', () => {
    it.each(['SiO2', 'Al2O3', 'CaF2', 'NaF'])('accepts %s', formula => {
      expect(EutecticIndex.looksLikeOxideOrFluoride(formula)).toBe(true);
    });

    it.each(['SiC', 'Fe', 'NaCl', 'Si3N4', 'C'])('rejects %s', formula => {
      expect(EutecticIndex.looksLikeOxideOrFluoride(formula)).toBe(false);
    });
  });

  describe('bestMatch', () => {
    it('prefers the exact component set (CaO-Al2O3-SiO2 ternary eutectic, 1405 °C)', () => {
      const match = EutecticIndex.bestMatch(['SiO2', 'CaO', 'Al2O3']);
      expect(match?.components.slice().sort()).toEqual(['Al2O3', 'CaO', 'SiO2']);
      expect(match?.temperature_C).toBe(1405);
      expect(EutecticIndex.isExactMatch(match, ['SiO2', 'CaO', 'Al2O3'])).toBe(true);
    });

    it('ignores non-oxide components in the request', () => {
      const match = EutecticIndex.bestMatch(['SiO2', 'CaO', 'Al2O3', 'SiC', 'C']);
      expect(match?.temperature_C).toBe(1405);
    });

    it('falls back to a subsystem; weights keep the dominant oxides covered', () => {
      const match = EutecticIndex.bestMatch(['Al2O3', 'SiO2', 'CaO', 'Fe2O3'], {
        Al2O3: 50, SiO2: 45, CaO: 4, Fe2O3: 1,
      });
      expect(match?.components).toEqual(expect.arrayContaining(['Al2O3', 'SiO2']));
      expect(EutecticIndex.isExactMatch(match, ['Al2O3', 'SiO2', 'CaO', 'Fe2O3'])).toBe(false);
    });

    it('returns undefined when no eutectic fits', () => {
      expect(EutecticIndex.bestMatch(['SiO2'])).toBeUndefined();
      expect(EutecticIndex.bestMatch([])).toBeUndefined();
    });
  });

  describe('weightComposition', () => {
    it('converts mol% to wt% with g/mol molar masses (CaO·SiO2 50/50 mol)', () => {
      const wt = EutecticIndex.weightComposition(entry(['CaO', 'SiO2'], [50, 50]));
      expect(wt.CaO).toBeCloseTo((100 * 56.0774) / (56.0774 + 60.0843), 1);
      expect(wt.CaO + wt.SiO2).toBeCloseTo(100, 6);
    });

    it('returns an empty record without a composition', () => {
      expect(EutecticIndex.weightComposition(entry(['CaO', 'SiO2'], null))).toEqual({});
    });
  });
});
