/**
 * Unit tests for CompoundPropertyResolver.
 *
 * Verifies:
 *   - Default heatCapacity uses nasa7 when present (CO2, N2)
 *   - Explicit preferred index selects correct values[] entry
 *   - Explicit preferred RefKey selects correct values[] entry
 *   - Unknown preferred falls back to def
 *   - enthalpy/entropy/gibbsEnergy delegate to nasa7
 *   - enthalpy/entropy/gibbsEnergy return NaN when nasa7 absent
 *   - viscosity and thermalConductivity use values[def]
 *   - heatCapacityAverage uses nasa7 by default
 *   - G = H − T·S via resolver
 */

import { CompoundPropertyResolver } from '../../../../src/common/thermal/utils/compound-property-resolver';
import { RefKey } from '../../../../src/common/thermal/enum/ref-key.enum';
import { CO2 } from '../../../../src/common/thermal/compound/gas/co2';
import { N2  } from '../../../../src/common/thermal/compound/gas/n2';
import { CompoundValue } from '../../../../src/common/thermal/interfaces/compound-value.interface';
import { EquationTypeDto } from '../../../../src/common/thermal/dto/equation-type.dto';

// ─── Helper — minimal CompoundValue without nasa7 ─────────────────────────────

function noNasa7(): CompoundValue {
  return {
    name: 'Test', chemicalFormula: 'Xx', Mr: 0.028,
    enthalpyFormation298: 0, gibbsEnergy298: 0,
    collisionDiameter: 3.8, epsilonToKb: 71,
    heatCapacity: {
      def: 1,
      values: [
        { type: EquationTypeDto.linear, ref: RefKey.Szargut,
          vars: { a: 25, b: 0.01 }, min: 200, max: 1500 },
        { type: EquationTypeDto.quadratic, ref: RefKey.Borgnakke,
          vars: { a: 28, b: 0.005, c: -1e-6 }, min: 200, max: 1500 },
      ],
    },
    viscosity: {
      def: 0,
      values: [
        { type: EquationTypeDto.quadratic, ref: RefKey.Yaws1999,
          vars: { a: 1.5, b: 0.1, c: -5e-5 }, min: 200, max: 1500, k: 1e-6 },
      ],
    },
    thermalConductivity: {
      def: 0,
      values: [
        { type: EquationTypeDto.quadratic, ref: RefKey.Incropera,
          vars: { a: 0.005, b: 6e-5, c: -1e-8 }, min: 200, max: 1500 },
      ],
    },
  };
}

// ─── nasa7 as default ─────────────────────────────────────────────────────────

describe('CompoundPropertyResolver — nasa7 default (CO2)', () => {
  const resolver = new CompoundPropertyResolver(CO2);

  it('heatCapacity() without preferred uses nasa7 — Cp ≈ 37 J/(mol·K) at 300 K', () => {
    const cp = resolver.heatCapacity(300);
    expect(cp).toBeGreaterThan(35);
    expect(cp).toBeLessThan(40);
  });

  it('heatCapacityAverage(300,1000) without preferred uses nasa7', () => {
    const avg = resolver.heatCapacityAverage(300, 1000);
    expect(avg).toBeGreaterThan(38);
    expect(avg).toBeLessThan(58);
  });

  it('enthalpy at 298 K ≈ −393.5 kJ/mol', () => {
    expect(resolver.enthalpy(298) / 1000).toBeCloseTo(-393.5, 0);
  });

  it('entropy at 298 K is positive', () => {
    expect(resolver.entropy(298)).toBeGreaterThan(0);
  });

  it('gibbsEnergy = enthalpy − T·entropy at 1000 K', () => {
    const T = 1000;
    expect(resolver.gibbsEnergy(T)).toBeCloseTo(
      resolver.enthalpy(T) - T * resolver.entropy(T), 3,
    );
  });
});

// ─── Preferred by index ───────────────────────────────────────────────────────

describe('CompoundPropertyResolver — preferred by index (N2)', () => {
  const resolver = new CompoundPropertyResolver(N2);

  it('preferred=0 selects quartic (Yaws1999) — bypasses nasa7', () => {
    const cp = resolver.heatCapacity(300, 0);
    expect(cp).toBeGreaterThan(28);
    expect(cp).toBeLessThan(31);
  });

  it('preferred=1 selects cubic (Borgnakke)', () => {
    const cp = resolver.heatCapacity(300, 1);
    expect(cp).toBeGreaterThan(28);
    expect(cp).toBeLessThan(31);
  });

  it('preferred=99 (out of range) falls back to def', () => {
    const def      = resolver.heatCapacity(300, N2.heatCapacity.def);
    const fallback = resolver.heatCapacity(300, 99);
    expect(fallback).toBeCloseTo(def, 8);
  });
});

// ─── Preferred by RefKey ──────────────────────────────────────────────────────

describe('CompoundPropertyResolver — preferred by RefKey (N2)', () => {
  const resolver = new CompoundPropertyResolver(N2);

  it('preferred=RefKey.Yaws1999 selects quartic entry', () => {
    const cp = resolver.heatCapacity(300, RefKey.Yaws1999);
    expect(cp).toBeGreaterThan(28);
    expect(cp).toBeLessThan(31);
  });

  it('preferred=RefKey.Borgnakke selects cubic entry', () => {
    const cp = resolver.heatCapacity(300, RefKey.Borgnakke);
    expect(cp).toBeGreaterThan(28);
    expect(cp).toBeLessThan(31);
  });

  it('preferred=RefKey that is absent falls back to def', () => {
    // Asano2006 is not a ref for N2 heatCapacity entries
    const def      = resolver.heatCapacity(300, N2.heatCapacity.def);
    const fallback = resolver.heatCapacity(300, RefKey.Asano2006);
    expect(fallback).toBeCloseTo(def, 8);
  });
});

// ─── No nasa7 ────────────────────────────────────────────────────────────────

describe('CompoundPropertyResolver — compound without nasa7', () => {
  const resolver = new CompoundPropertyResolver(noNasa7());

  it('heatCapacity() uses values[def=1] (quadratic): 28+0.005·300−1e-6·300²', () => {
    const expected = 28 + 0.005 * 300 - 1e-6 * 300 * 300;
    expect(resolver.heatCapacity(300)).toBeCloseTo(expected, 6);
  });

  it('heatCapacity(300, 0) uses linear: 25+0.01·300=28', () => {
    expect(resolver.heatCapacity(300, 0)).toBeCloseTo(28, 6);
  });

  it('enthalpy() returns NaN', () => {
    expect(resolver.enthalpy(500)).toBeNaN();
  });

  it('entropy() returns NaN', () => {
    expect(resolver.entropy(500)).toBeNaN();
  });

  it('gibbsEnergy() returns NaN', () => {
    expect(resolver.gibbsEnergy(500)).toBeNaN();
  });
});

// ─── Transport properties ─────────────────────────────────────────────────────

describe('CompoundPropertyResolver — transport (CO2)', () => {
  const resolver = new CompoundPropertyResolver(CO2);

  it('viscosity at 500 K is in (0, 1e-3) Pa·s', () => {
    const mu = resolver.viscosity(500);
    expect(mu).toBeGreaterThan(0);
    expect(mu).toBeLessThan(1e-3);
  });

  it('thermalConductivity at 500 K is in (0, 0.2) W/(m·K)', () => {
    const lam = resolver.thermalConductivity(500);
    expect(lam).toBeGreaterThan(0);
    expect(lam).toBeLessThan(0.2);
  });

  it('viscosity increases with T (quadratic fit for CO2)', () => {
    expect(resolver.viscosity(800)).toBeGreaterThan(resolver.viscosity(300));
  });
});

