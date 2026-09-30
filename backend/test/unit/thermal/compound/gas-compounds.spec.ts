/**
 * Unit tests for gas compound data files and GAS_REGISTRY.
 *
 * Verifies structural integrity and physical sanity of all registered species:
 *   Ar
 *   N2, O2, CO2, CO, H2O, H2, CH4, NH3  (8 combustion-relevant species)
 *   SO2, SO3, NO, NO2                    (4 sulfur/nitrogen oxides)
 *
 * Total: 13 species.
 *
 * Checks per compound:
 *   - Present in GAS_REGISTRY
 *   - Required fields populated (name, chemicalFormula, Mr, etc.)
 *   - nasa7Key resolves to a NASA-7 record with both low/high ranges and Tswitch
 *   - All NASA-7 coefficients are finite numbers
 *   - heatCapacity.values non-empty; all entries have type, ref, vars, min, max
 *   - Cp at 300 K via nasa7 within ±2 J/(mol·K) of NIST (for species with NASA-7)
 *   - CompoundPropertyResolver works for each species
 */

import { GAS_REGISTRY } from '../../../../src/common/thermal/compound/gas/registry';
import { CompoundPropertyResolver } from '../../../../src/common/thermal/utils/compound-property-resolver';
import { Nasa7EquationMethod } from '../../../../src/common/thermal/utils/nasa7-equation-method';
import { Nasa9EquationMethod } from '../../../../src/common/thermal/utils/nasa9-equation-method';
import { heatCapacityEntries } from '../../../../src/common/thermal/utils/heat-capacity-entries';
import {
  compoundNasa7, compoundNasa9, nasa7Species, nasa9Species,
} from '../../../../src/common/thermal/utils/nasa-database';
import { EquationTypeDto } from '../../../../src/common/thermal/dto/equation-type.dto';
import { RefKey } from '../../../../src/common/thermal/enum/ref-key.enum';

const nasa7Method = new Nasa7EquationMethod();
const nasa9Method = new Nasa9EquationMethod();

const nasa7Of = (sp: string) => compoundNasa7(GAS_REGISTRY[sp])!.nasa7;
const nasa9Of = (sp: string) => compoundNasa9(GAS_REGISTRY[sp])!.nasa9;

// NIST JANAF Cp at 300 K [J/(mol·K)]
const CP_300K_NIST: Record<string, number> = {
  N2: 29.12, O2: 29.38, CO2: 37.14, CO: 29.14,
  H2O: 33.60, H2: 28.85, CH4: 35.71, NH3: 35.65,
};

/** Species that carry a NASA-7 dataset and should be validated against NIST Cp. */
const NASA7_SPECIES = ['N2', 'O2', 'CO2', 'CO', 'H2O', 'H2', 'CH4', 'NH3'] as const;
type Sp = typeof NASA7_SPECIES[number];

/** All registered species — must match GAS_REGISTRY exactly. */
const ALL_SPECIES = [
  'Ar', 'N2', 'O2', 'CO2', 'CO', 'H2O', 'H2', 'CH4', 'NH3', 'SO2', 'SO3', 'NO', 'NO2',
  'C2H6', 'C3H8', 'C4H10', 'iC4H10', 'C2H2', 'C3H4', 'aC3H4', 'C3H6',
] as const;

// ─── Registry ─────────────────────────────────────────────────────────────────

describe('GAS_REGISTRY — 21 species registered', () => {
  it('contains exactly the combustion, sulphur, nitrogen and fuel-gas species', () => {
    for (const sp of ALL_SPECIES) {
      expect(GAS_REGISTRY).toHaveProperty(sp);
    }
    expect(Object.keys(GAS_REGISTRY).length).toBe(ALL_SPECIES.length);
  });
});

// ─── Structural checks — one describe block per species ───────────────────────

for (const sp of NASA7_SPECIES as unknown as Sp[]) {
  const c = GAS_REGISTRY[sp];

  describe(`compound data — ${sp}`, () => {
    it('name, chemicalFormula, Mr in range', () => {
      expect(typeof c.name).toBe('string');
      expect(c.name.length).toBeGreaterThan(0);
      expect(c.chemicalFormula).toBe(sp);
      expect(c.Mr).toBeGreaterThan(0.001);
      expect(c.Mr).toBeLessThan(0.2);
    });

    it('NASA-7 record with Tswitch 500–2000 K, low and high coefficients', () => {
      expect(c.nasa7Key).toBeDefined();
      const n = nasa7Of(sp);
      expect(n.Tswitch).toBeGreaterThan(500);
      expect(n.Tswitch).toBeLessThan(2000);
      expect(n.low).toBeDefined();
      expect(n.high).toBeDefined();
    });

    it('all NASA-7 coefficients are finite numbers', () => {
      const n = nasa7Of(sp);
      for (const range of [n.low, n.high]) {
        for (const key of ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7'] as const) {
          expect(Number.isFinite(range[key])).toBe(true);
        }
      }
    });

    it(`NASA-7 Cp at 300 K within ±2 J/(mol·K) of NIST (${CP_300K_NIST[sp]})`, () => {
      const cp = nasa7Method.calculate(300, nasa7Of(sp), 200, 6000);
      expect(cp).toBeGreaterThan(CP_300K_NIST[sp] - 2);
      expect(cp).toBeLessThan(CP_300K_NIST[sp] + 2);
    });

    it('heatCapacityEntries ≥1 entry with required fields', () => {
      const { values } = heatCapacityEntries(c);
      expect(values.length).toBeGreaterThan(0);
      for (const v of values) {
        expect(v.type).toBeDefined();
        expect(v.ref).toBeDefined();
        expect(v.vars).toBeDefined();
        expect(typeof v.min).toBe('number');
        expect(typeof v.max).toBe('number');
        expect(v.min).toBeLessThan(v.max);
      }
    });

    it('heatCapacityEntries.def is valid index', () => {
      const { def, values } = heatCapacityEntries(c);
      expect(def).toBeGreaterThanOrEqual(0);
      expect(def).toBeLessThan(values.length);
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

// ─── NASA-9 datasets and heat capacity sources ───────────────────────────────

/** nasa9.json keys CO2, O2, NO2 hold other species (Burcat entries: ΔHf ≠ that of the gas) */
const WITHOUT_NASA9 = ['CO2', 'O2', 'NO2'];

describe('NASA databases', () => {
  it('every nasa7Key / nasa9Key exists in nasa7.json / nasa9.json', () => {
    for (const sp of ALL_SPECIES) {
      const c = GAS_REGISTRY[sp];
      if (c.nasa7Key) expect(nasa7Species(c.nasa7Key).nasa7).toBeDefined();
      if (c.nasa9Key) expect(nasa9Species(c.nasa9Key).nasa9.ranges.length).toBeGreaterThan(0);
    }
  });

  it('unknown key throws', () => {
    expect(() => nasa7Species('no-such-species')).toThrow('NASA-7 species "no-such-species"');
    expect(() => nasa9Species('no-such-species')).toThrow('NASA-9 species "no-such-species"');
  });

  it('NASA-7 present for every species', () => {
    for (const sp of ALL_SPECIES) expect(GAS_REGISTRY[sp].nasa7Key).toBeDefined();
  });
});

describe('NASA-9 datasets', () => {
  it('present for every species except CO2, O2, NO2', () => {
    const withNasa9 = ALL_SPECIES.filter(sp => GAS_REGISTRY[sp].nasa9Key);
    expect([...withNasa9].sort()).toEqual(ALL_SPECIES.filter(sp => !WITHOUT_NASA9.includes(sp)).sort());
  });

  for (const sp of ALL_SPECIES.filter(s => !WITHOUT_NASA9.includes(s))) {
    const c = GAS_REGISTRY[sp];

    it(`${sp}: ranges contiguous, H(298.15) = tabulated ΔHf ± 2 kJ/mol`, () => {
      const { ranges } = nasa9Of(sp);
      for (let i = 1; i < ranges.length; i++) expect(ranges[i].Tmin).toBe(ranges[i - 1].Tmax);
      if (c.enthalpyFormation298 !== undefined) {
        expect(Math.abs(nasa9Method.enthalpy(298.15, nasa9Of(sp)) - c.enthalpyFormation298)).toBeLessThan(2000);
      }
    });

    // NH3 NASA-9 is Burcat T12/04 (G3B3 RRHO fit), NASA-7 is TPIS 1989: 3–4 % apart at 300–1000 K
    const cpTolerance = sp === 'NH3' ? 0.04 : 0.02;
    it(`${sp}: NASA-9 Cp within ${cpTolerance * 100} % of NASA-7 at 300, 1000, 2500 K`, () => {
      for (const T of [300, 1000, 2500]) {
        const cp9 = nasa9Method.calculate(T, nasa9Of(sp), 200, 6000);
        const cp7 = nasa7Method.calculate(T, nasa7Of(sp), 200, 6000);
        expect(Math.abs(cp9 / cp7 - 1)).toBeLessThan(cpTolerance);
      }
    });
  }

  it('new fuel gases have no tabulated heatCapacity; default Cp is NASA-9', () => {
    for (const sp of ['C2H6', 'C3H8', 'C4H10', 'iC4H10', 'C2H2', 'C3H4', 'aC3H4', 'C3H6']) {
      const c = GAS_REGISTRY[sp];
      expect(c.heatCapacity).toBeUndefined();
      const { def, values } = heatCapacityEntries(c);
      expect(values.map(v => v.type)).toEqual([EquationTypeDto.nasa9, EquationTypeDto.nasa7]);
      expect(values[def].type).toBe(EquationTypeDto.nasa9);
    }
  });

  it('new fuel gases carry sourced data only: IUPAC Mr, Perry8 μ/λ, Perry9 ΔHf/ΔGf, Sutherland from Eakin1963', () => {
    const withSutherland = ['C2H6', 'C3H8', 'C4H10'];
    const atomic: Record<string, number> = { C: 0.012011, H: 0.001008 };
    // Perry9 Table 2-95 as printed, J/kmol × 1E-07: [ΔHf, ΔGf]
    const perry9: Record<string, [number, number]> = {
      C2H6: [-8.382, -3.192], C3H8: [-10.468, -2.439], C4H10: [-12.579, -1.67], iC4H10: [-13.499, -2.144],
      C2H2: [22.82, 21.068], C3H4: [18.49, 19.384], aC3H4: [19.05, 20.08], C3H6: [2.023, 6.264],
    };
    for (const sp of ['C2H6', 'C3H8', 'C4H10', 'iC4H10', 'C2H2', 'C3H4', 'aC3H4', 'C3H6']) {
      const c = GAS_REGISTRY[sp];
      const [, nC, nH] = c.chemicalFormula.match(/^C(\d+)H(\d+)$/)!;
      expect(c.Mr).toBeCloseTo(Number(nC) * atomic.C + Number(nH) * atomic.H, 9);
      for (const v of [...c.viscosity.values, ...c.thermalConductivity.values]) {
        expect(v.type).toBe(EquationTypeDto.dipprN102);
        expect(v.ref).toBe(RefKey.Perry8);
      }
      expect(c.enthalpyFormation298).toBeCloseTo(perry9[sp][0] * 1e4, 6);
      expect(c.gibbsEnergy298).toBeCloseTo(perry9[sp][1] * 1e4, 6);
      expect(c.sutherlandParams !== undefined).toBe(withSutherland.includes(sp));
    }
    expect(GAS_REGISTRY['aC3H4'].collisionDiameter).toBeUndefined();
    expect(GAS_REGISTRY['aC3H4'].epsilonToKb).toBeUndefined();
  });

  it('tabulated heatCapacity keeps its indices; NASA entries are appended; default is NASA-9', () => {
    const n2 = GAS_REGISTRY['N2'];
    const { def, values } = heatCapacityEntries(n2);
    expect(values.slice(0, n2.heatCapacity!.values.length)).toEqual(n2.heatCapacity!.values);
    expect(values.slice(-2).map(v => v.type)).toEqual([EquationTypeDto.nasa9, EquationTypeDto.nasa7]);
    expect(values[def].type).toBe(EquationTypeDto.nasa9);
  });

  it('without NASA-9 the default is NASA-7 (CO2, O2, NO2)', () => {
    for (const sp of WITHOUT_NASA9) {
      const { def, values } = heatCapacityEntries(GAS_REGISTRY[sp]);
      expect(values[def].type).toBe(EquationTypeDto.nasa7);
    }
  });
});

// ─── CompoundPropertyResolver integration ────────────────────────────────────

for (const sp of NASA7_SPECIES as unknown as Sp[]) {
  const resolver = new CompoundPropertyResolver(GAS_REGISTRY[sp]);

  describe(`CompoundPropertyResolver — ${sp}`, () => {
    it('heatCapacity at 500 K (default NASA dataset) > 20 J/(mol·K)', () => {
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
  it('all 8 combustion species Cp at 1000 K: positive and < 80 J/(mol·K)', () => {
    for (const sp of NASA7_SPECIES) {
      const cp = nasa7Method.calculate(1000, nasa7Of(sp), 200, 6000);
      expect(cp).toBeGreaterThan(0);
      expect(cp).toBeLessThan(80);
    }
  });

  it('CO2 Cp > N2 Cp at 300 K (triatomic > diatomic)', () => {
    const cpCO2 = nasa7Method.calculate(300, nasa7Of('CO2'), 200, 6000);
    const cpN2  = nasa7Method.calculate(300, nasa7Of('N2'), 200, 6000);
    expect(cpCO2).toBeGreaterThan(cpN2);
  });

  it('all 8 combustion species Cp at 300 K within ±2 of NIST', () => {
    for (const sp of NASA7_SPECIES) {
      const cp   = nasa7Method.calculate(300, nasa7Of(sp), 200, 6000);
      const nist = CP_300K_NIST[sp];
      expect(cp).toBeGreaterThan(nist - 2);
      expect(cp).toBeLessThan(nist + 2);
    }
  });
});

