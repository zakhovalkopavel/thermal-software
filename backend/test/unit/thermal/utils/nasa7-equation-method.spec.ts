/**
 * Unit tests for Nasa7EquationMethod.
 *
 * Equations (per range):
 *   Cp/R  = a1 + a2·T + a3·T² + a4·T³ + a5·T⁴
 *   H/RT  = a1 + a2·T/2 + a3·T²/3 + a4·T³/4 + a5·T⁴/5 + a6/T
 *   S/R   = a1·ln T + a2·T + a3·T²/2 + a4·T³/3 + a5·T⁴/4 + a7
 *   G     = H − T·S
 *
 * Reference values: NIST WebBook JANAF tables
 *
 * Verifies:
 *   - CO2 Cp at 300 K and 1000 K vs NIST
 *   - N2 Cp at 300 K and 1000 K vs NIST
 *   - Tswitch continuity: Cp agrees at 999.999 K and 1000.001 K within 1 J/(mol·K)
 *   - enthalpy() sign and magnitude (CO2 ≈ -393.5 kJ/mol at 298 K)
 *   - entropy() is positive; CO2 S° at 298 K ≈ 213.8 J/(mol·K)
 *   - G = H − T·S identity
 *   - calculateAverage() spanning Tswitch handled correctly
 *   - integral() exact polynomial antiderivative via FD check
 *   - clamping, scaling, and T1=T2 edge cases
 */

import { Nasa7EquationMethod } from '../../../../src/common/thermal/utils/nasa7-equation-method';
import { Nasa7Equation } from '../../../../src/common/thermal/type/nasa7-equation';
import { CO2 } from '../../../../src/common/thermal/compound/gas/co2';
import { N2  } from '../../../../src/common/thermal/compound/gas/n2';
import { Common } from '../../../../src/common/thermal/utils/common';

const method = new Nasa7EquationMethod();
const R = Common.R;

// ─── CO2 ─────────────────────────────────────────────────────────────────────

describe('Nasa7EquationMethod — CO2', () => {
  const vars = CO2.nasa7 as Nasa7Equation;

  // NIST JANAF: CO2 Cp at 300 K = 37.135 J/(mol·K)
  it('Cp at 300 K ≈ 37.1 J/(mol·K) (NIST JANAF)', () => {
    expect(method.calculate(300, vars, 200, 6000)).toBeCloseTo(37.135, 0);
  });

  // NIST JANAF: CO2 Cp at 1000 K = 54.308 J/(mol·K)
  it('Cp at 1000 K ≈ 54.3 J/(mol·K) (NIST JANAF)', () => {
    expect(method.calculate(1000, vars, 200, 6000)).toBeCloseTo(54.308, 0);
  });

  it('Cp at 2000 K is between 56 and 62 J/(mol·K)', () => {
    const cp = method.calculate(2000, vars, 200, 6000);
    expect(cp).toBeGreaterThan(56);
    expect(cp).toBeLessThan(62);
  });

  // CO2 standard enthalpy of formation ≈ -393.51 kJ/mol
  it('enthalpy at 298 K ≈ −393.5 kJ/mol', () => {
    expect(method.enthalpy(298, vars) / 1000).toBeCloseTo(-393.5, 0);
  });

  // NIST: S°(298 K) for CO2 ≈ 213.8 J/(mol·K)
  it('entropy at 298 K ≈ 213.8 J/(mol·K) (NIST JANAF)', () => {
    expect(method.entropy(298, vars)).toBeCloseTo(213.8, 0);
  });

  it('entropy is positive at all temperatures', () => {
    for (const T of [300, 500, 1000, 2000]) {
      expect(method.entropy(T, vars)).toBeGreaterThan(0);
    }
  });

  it('G = H − T·S at 1000 K', () => {
    const T = 1000;
    const H = method.enthalpy(T, vars);
    const S = method.entropy(T, vars);
    expect(method.gibbsEnergy(T, vars)).toBeCloseTo(H - T * S, 3);
  });

  it('Tswitch continuity — Cp at 999.999 K and 1000.001 K differ by < 1 J/(mol·K)', () => {
    const cpLow  = method.calculate(999.999,  vars, 200, 6000);
    const cpHigh = method.calculate(1000.001, vars, 200, 6000);
    expect(Math.abs(cpLow - cpHigh)).toBeLessThan(1.0);
  });

  it('calculateAverage spanning Tswitch [500,1500] is 44–60 J/(mol·K)', () => {
    const avg = method.calculateAverage(500, 1500, vars, 200, 6000);
    expect(avg).toBeGreaterThan(44);
    expect(avg).toBeLessThan(60);
  });

  it('integral derivative equals calculate (finite difference at 600 K)', () => {
    const h = 1e-4;
    const T = 600;
    const dI = (method.integral(T + h, vars, 200, 6000) - method.integral(T - h, vars, 200, 6000)) / (2 * h);
    expect(dI).toBeCloseTo(method.calculate(T, vars, 200, 6000), 3);
  });
});

// ─── N2 ──────────────────────────────────────────────────────────────────────

describe('Nasa7EquationMethod — N2', () => {
  const vars = N2.nasa7 as Nasa7Equation;

  // NIST JANAF: N2 Cp at 300 K ≈ 29.12 J/(mol·K)
  it('Cp at 300 K ≈ 29.1 J/(mol·K)', () => {
    expect(method.calculate(300, vars, 200, 6000)).toBeCloseTo(29.12, 0);
  });

  // NIST JANAF: N2 Cp at 1000 K ≈ 32.70 J/(mol·K) — uses high-range coefficients
  it('Cp at 1000 K ≈ 32.7 J/(mol·K) (high-range coefficients)', () => {
    expect(method.calculate(1000, vars, 200, 6000)).toBeCloseTo(32.70, 0);
  });

  // N2 Hf° = 0 J/mol (reference element); a6 encodes this
  it('enthalpy at 298 K is within ±500 J/mol of 0 (reference element)', () => {
    expect(Math.abs(method.enthalpy(298, vars))).toBeLessThan(500);
  });

  // NIST: N2 S°(298 K) ≈ 191.6 J/(mol·K)
  it('entropy at 298 K ≈ 191.6 J/(mol·K)', () => {
    expect(method.entropy(298, vars)).toBeCloseTo(191.6, 0);
  });

  it('G = H − T·S identity at 500 K', () => {
    const T = 500;
    expect(method.gibbsEnergy(T, vars)).toBeCloseTo(
      method.enthalpy(T, vars) - T * method.entropy(T, vars), 3,
    );
  });

  it('calculateAverage wholly in low range [300,900] is 29–33 J/(mol·K)', () => {
    const avg = method.calculateAverage(300, 900, vars, 200, 6000);
    expect(avg).toBeGreaterThan(29);
    expect(avg).toBeLessThan(33);
  });

  it('calculateAverage wholly in high range [1100,2000] is > 30 J/(mol·K)', () => {
    expect(method.calculateAverage(1100, 2000, vars, 200, 6000)).toBeGreaterThan(30);
  });
});

// ─── Edge cases ───────────────────────────────────────────────────────────────

describe('Nasa7EquationMethod — edge cases', () => {
  const vars = N2.nasa7 as Nasa7Equation;

  it('clamps T below 200 K to 200 K', () => {
    expect(method.calculate(100, vars, 200, 6000)).toBeCloseTo(
      method.calculate(200, vars, 200, 6000), 8,
    );
  });

  it('clamps T above 6000 K to 6000 K', () => {
    expect(method.calculate(9000, vars, 200, 6000)).toBeCloseTo(
      method.calculate(6000, vars, 200, 6000), 8,
    );
  });

  it('calculateAverage with T1=T2 equals calculate at that point', () => {
    const T = 800;
    expect(method.calculateAverage(T, T, vars, 200, 6000)).toBeCloseTo(
      method.calculate(T, vars, 200, 6000), 6,
    );
  });

  it('Cp is positive over [300, 5000] K', () => {
    for (const T of [300, 500, 800, 1000, 1500, 2000, 3000, 5000]) {
      expect(method.calculate(T, vars, 200, 6000)).toBeGreaterThan(0);
    }
  });

  it('scaling factor k=0.001 applied', () => {
    const T = 500;
    const full   = method.calculate(T, vars, 200, 6000, 1);
    const scaled = method.calculate(T, vars, 200, 6000, 0.001);
    expect(scaled).toBeCloseTo(full * 0.001, 10);
  });

  it('Cp/R ≈ 3.5 for N2 at 300 K (diatomic)', () => {
    expect(method.calculate(300, vars, 200, 6000) / R).toBeCloseTo(3.5, 1);
  });
});

