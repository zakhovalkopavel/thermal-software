import {
  COMPOUND_LIBRARY, PERIODIC_TABLE, atomicMass, calculateMolarMass, molarMass, molarMassGramsPerMol,
  molarMassTableGramsPerMol, parseFormula,
} from '../../../../src/common/chemistry';

describe('Chemistry library', () => {
  describe('parseFormula', () => {
    it('parses simple formulas', () => {
      expect(parseFormula('C3H8')).toEqual({ C: 3, H: 8 });
      expect(parseFormula('SO2')).toEqual({ S: 1, O: 2 });
      expect(parseFormula('Ar')).toEqual({ Ar: 1 });
    });

    it('parses nested groups, hydrates and decimal counts', () => {
      expect(parseFormula('Ca3(PO4)2')).toEqual({ Ca: 3, P: 2, O: 8 });
      expect(parseFormula('K4[Fe(CN)6]')).toEqual({ K: 4, Fe: 1, C: 6, N: 6 });
      expect(parseFormula('CaSO4·2H2O')).toEqual({ Ca: 1, S: 1, O: 6, H: 4 });
      expect(parseFormula('3Al2O3*2SiO2')).toEqual({ Al: 6, O: 13, Si: 2 });
      expect(parseFormula('Fe0.95O').Fe).toBeCloseTo(0.95, 12);
    });

    it('rejects malformed formulas', () => {
      expect(() => parseFormula('c2')).toThrow();
      expect(() => parseFormula('Ca(OH2')).toThrow();
      expect(() => parseFormula('CaOH)2')).toThrow();
      expect(() => parseFormula('Ca[OH)2')).toThrow();
    });
  });

  describe('periodic table', () => {
    it('lists all 118 elements in atomic-number order', () => {
      const numbers = Object.values(PERIODIC_TABLE).map((e) => e.atomicNumber);
      expect(numbers).toEqual(Array.from({ length: 118 }, (_, i) => i + 1));
    });

    it('returns atomic masses in kg/mol', () => {
      expect(atomicMass('C')).toBeCloseTo(0.012011, 15);
      expect(atomicMass('O')).toBeCloseTo(0.015999, 15);
    });

    it('throws for unknown symbols and elements without a standard atomic weight', () => {
      expect(() => atomicMass('Xx')).toThrow();
      expect(() => atomicMass('Tc')).toThrow();
    });
  });

  describe('molar mass', () => {
    it('calculates molar mass from the formula', () => {
      expect(calculateMolarMass('H2O')).toBeCloseTo(0.018015, 9);
      expect(calculateMolarMass('CaCO3')).toBeCloseTo(0.100086, 9);
    });

    it('prefers the library value and falls back to the formula', () => {
      expect(molarMass('NO2')).toBe(COMPOUND_LIBRARY.NO2.molarMass_kg_mol);
      expect(molarMass('CaCO3')).toBeCloseTo(calculateMolarMass('CaCO3'), 15);
    });

    it('converts to g/mol', () => {
      expect(molarMassGramsPerMol('SiO2')).toBeCloseTo(60.08, 10);
      expect(molarMassTableGramsPerMol(['SiO2', 'CaO'])).toEqual({
        SiO2: molarMassGramsPerMol('SiO2'),
        CaO: molarMassGramsPerMol('CaO'),
      });
    });

    it('library values agree with their formulas within 0.1 %', () => {
      for (const [formula, compound] of Object.entries(COMPOUND_LIBRARY)) {
        if (formula === 'Air') continue;
        const calculated = calculateMolarMass(formula);
        expect(Math.abs(compound.molarMass_kg_mol - calculated) / calculated).toBeLessThan(1e-3);
      }
    });
  });
});
