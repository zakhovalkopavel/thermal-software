/**
 * Unit tests for gas compound data files and GAS_REGISTRY.
 *
 * Verifies structural integrity and physical sanity of all 8 registered species:
 *   N2, O2, CO2, CO, H2O, H2, CH4, NH3
 *
 * Checks per compound:
 *   - Present in GAS_REGISTRY
 *   - Required fields populated (name, chemicalFormula, Mr, etc.)
 *   - nasa7 field present with both low/high ranges and Tswitch
 *   - All NASA-7 coefficients are finite numbers
 *   - heatCapacity.values non-empty; all entries have type, ref, vars, min, max
 *   - Cp at 300 K via nasa7 within ±2 J/(mol·K) of NIST
 *   - CompoundPropertyResolver works for each species
 */

import { GAS_REGISTRY } from '../../../../src/common/thermal/compound/gas/registry';
import { CompoundPropertyResolver } from '../../../../src/common/thermal/utils/compound-property-resolver';
import { Nasa7EquationMethod } from '../../../../src/common/thermal/utils/nasa7-equation-method';
import { Nasa7Equation } from '../../../../src/common/thermal/type/nasa7-equation';

const nasa7Method = new Nasa7EquationMethod();

// NIST JANAF Cp at 300 K [J/(mol·K)]
const CP_300K_NIST: Record<string, number> = {
  N2: 29.12, O2: 29.38, CO2: 37.14, CO: 29.14,
  H2O: 33.60, H2: 28.85, CH4: 35.71, NH3: 35.65,
};

const SPECIES = ['N2', 'O2', 'CO2', 'CO', 'H2O', 'H2', 'CH4', 'NH3'] as const;
type Sp = typeof SPECIES[number];

// ─── Registry ─────────────────────────────────────────────────────────────────

describe('GAS_REGISTRY — 8 species registered', () => {
  it('contains exactly N2, O2, CO2, CO, H2O, H2, CH4, NH3', () => {
    for (const sp of SPECIES) {
      expect(GAS_REGISTRY).toHaveProperty(sp);
    }
    expect(Object.keys(GAS_REGISTRY).length).toBe(8);
  });
});

// ─── Structural checks — one describe block per species ───────────────────────

for (const sp of SPECIES as unknown as Sp[]) {
  const c = GAS_REGISTRY[sp];

  describe(`compound data — ${sp}`, () => {
    it('name, chemicalFormula, Mr in range', () => {
      expect(typeof c.name).toBe('string');
      expect(c.name.length).toBeGreaterThan(0);
      expect(c.chemicalFormula).toBe(sp);
      expect(c.Mr).toBeGreaterThan(0.001);
      expect(c.Mr).toBeLessThan(0.2);
    });

    it('nasa7 present with Tswitch 500–2000 K, low and high coefficients', () => {
      expect(c.nasa7).toBeDefined();
      const n = c.nasa7!;
      expect(n.Tswitch).toBeGreaterThan(500);
      expect(n.Tswitch).toBeLessThan(2000);
      expect(n.low).toBeDefined();
      expect(n.high).toBeDefined();
    });

    it('all nasa7 coefficients are finite numbers', () => {
      const n = c.nasa7!;
      for (const range of [n.low, n.high]) {
        for (const key of ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7'] as const) {
          expect(Number.isFinite(range[key])).toBe(true);
        }
      }
    });

    it(`nasa7 Cp at 300 K within ±2 J/(mol·K) of NIST (${CP_300K_NIST[sp]})`, () => {
      const cp = nasa7Method.calculate(300, c.nasa7 as Nasa7Equation, 200, 6000);
      expect(cp).toBeGreaterThan(CP_300K_NIST[sp] - 2);
      expect(cp).toBeLessThan(CP_300K_NIST[sp] + 2);
    });

    it('heatCapacity.values ≥1 entry with required fields', () => {
      expect(c.heatCapacity.values.length).toBeGreaterThan(0);
      for (const v of c.heatCapacity.values) {
        expect(v.type).toBeDefined();
        expect(v.ref).toBeDefined();
        expect(v.vars).toBeDefined();
        expect(typeof v.min).toBe('number');
        expect(typeof v.max).toBe('number');
        expect(v.min).toBeLessThan(v.max);
      }
    });

    it('heatCapacity.def is valid index', () => {
      expect(c.heatCapacity.def).toBeGreaterThanOrEqual(0);
      expect(c.heatCapacity.def).toBeLessThan(c.heatCapacity.values.length);
    });

    it('viscosity.values ≥1 entry', () => {
      expect(c.viscosity.values.length).toBeGreaterThan(0);
    });

    it('thermalConductivity.values ≥1 entry', () => {
      expect(c.thermalConductivity.values.length).toBeGreaterThan(0);
    });

    it('collisionDiameter and epsilonToKb are positive', () => {
      expect(c.collisionDiameter).toBeGreaterThan(0);
      expect(c.epsilonToKb).toBeGreaterThan(0);
    });
  });
}

// ─── CompoundPropertyResolver integration ────────────────────────────────────

for (const sp of SPECIES as unknown as Sp[]) {
  const resolver = new CompoundPropertyResolver(GAS_REGISTRY[sp]);

  describe(`CompoundPropertyResolver — ${sp}`, () => {
    it('heatCapacity at 500 K (nasa7) > 20 J/(mol·K)', () => {
      expect(resolver.heatCapacity(500)).toBeGreaterThan(20);
    });

    it('heatCapacity at 500 K via preferred=0 > 20 J/(mol·K)', () => {
      expect(resolver.heatCapacity(500, 0)).toBeGreaterThan(20);
    });

    it('heatCapacityAverage [300,1000] > 20 J/(mol·K)', () => {
      expect(resolver.heatCapacityAverage(300, 1000)).toBeGreaterThan(20);
    });

    it('enthalpy at 1000 K is finite', () => {
      expect(Number.isFinite(resolver.enthalpy(1000))).toBe(true);
    });

    it('entropy at 1000 K is positive', () => {
      expect(resolver.entropy(1000)).toBeGreaterThan(0);
    });

    it('viscosity at 500 K is in (0, 1e-3) Pa·s', () => {
      const mu = resolver.viscosity(500);
      expect(mu).toBeGreaterThan(0);
      expect(mu).toBeLessThan(1e-3);
    });

    it('thermalConductivity at 500 K is in (0, 0.5) W/(m·K)', () => {
      const lam = resolver.thermalConductivity(500);
      expect(lam).toBeGreaterThan(0);
      expect(lam).toBeLessThan(0.5);
    });
  });
}

// ─── Cross-compound sanity ────────────────────────────────────────────────────

describe('Cross-compound NASA-7 sanity', () => {
  it('all 8 species Cp at 1000 K: positive and < 80 J/(mol·K)', () => {
    for (const sp of SPECIES) {
      const cp = nasa7Method.calculate(1000, GAS_REGISTRY[sp].nasa7 as Nasa7Equation, 200, 6000);
      expect(cp).toBeGreaterThan(0);
      expect(cp).toBeLessThan(80);
    }
  });

  it('CO2 Cp > N2 Cp at 300 K (triatomic > diatomic)', () => {
    const cpCO2 = nasa7Method.calculate(300, GAS_REGISTRY['CO2'].nasa7 as Nasa7Equation, 200, 6000);
    const cpN2  = nasa7Method.calculate(300, GAS_REGISTRY['N2'].nasa7  as Nasa7Equation, 200, 6000);
    expect(cpCO2).toBeGreaterThan(cpN2);
  });

  it('all 8 species Cp at 300 K within ±2 of NIST', () => {
    for (const sp of SPECIES) {
      const cp   = nasa7Method.calculate(300, GAS_REGISTRY[sp].nasa7 as Nasa7Equation, 200, 6000);
      const nist = CP_300K_NIST[sp];
      expect(cp).toBeGreaterThan(nist - 2);
      expect(cp).toBeLessThan(nist + 2);
    }
  });
});

