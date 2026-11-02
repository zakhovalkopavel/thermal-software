/**
 * Unit tests for Nasa7EquationMethod.
 *
 * Equations (per range):
 *   Cp/R  = a1 + a2·T + a3·T² + a4·T³ + a5·T⁴
 *   H/RT  = a1 + a2·T/2 + a3·T²/3 + a4·T³/4 + a5·T⁴/5 + a6/T
 *   S/R   = a1·ln T + a2·T + a3·T²/2 + a4·T³/3 + a5·T⁴/4 + a7
 *   G     = H − T·S
 *
 * Reference values: the gas (or reference-state) row in shared/processed/JANAF
 *
 * Verifies:
 *   - CO2 Cp at 300 K and 1000 K vs the JANAF row
 *   - N2 Cp at 300 K and 1000 K vs the JANAF row
 *   - Tswitch continuity: Cp agrees at 999.999 K and 1000.001 K within 1 J/(mol·K)
 *   - enthalpy() at 298.15 K vs the JANAF enthalpy of formation
 *   - entropy() is positive; S° at 298.15 K vs the JANAF row
 *   - G = H − T·S identity
 *   - calculateAverage() spanning Tswitch handled correctly
 *   - integral() exact polynomial antiderivative via FD check
 *   - clamping, scaling, and T1=T2 edge cases
 */

import { Nasa7EquationMethod } from '../../../../src/common/thermal/utils/equation-methods/nasa7-equation-method';
import { compoundNasa7 } from '../../../../src/common/thermal/utils/nasa';
import { CO2, N2 } from '../../../../src/common/thermal/compound/gas';
import { PHYSICAL_CONSTANTS } from '../../../../src/common/thermal/constants/physical.constants';
import { janafGasRow } from '../janaf-gas-row.util';

const method = new Nasa7EquationMethod();
const R = PHYSICAL_CONSTANTS.GAS_CONSTANT_J_MOLK;

// ─── CO2 ─────────────────────────────────────────────────────────────────────

describe('Nasa7EquationMethod — CO2', () => {
  const vars = compoundNasa7(CO2)!.nasa7;

  it('Cp at 300 K matches the JANAF row', () => {
    expect(method.calculate(300, vars, 200, 6000)).toBeCloseTo(janafGasRow('CO2', 300).Cp!, 0);
  });

  it('Cp at 1000 K matches the JANAF row', () => {
    expect(method.calculate(1000, vars, 200, 6000)).toBeCloseTo(janafGasRow('CO2', 1000).Cp!, 0);
  });

  it('Cp at 2000 K is between 56 and 62 J/(mol·K)', () => {
    const cp = method.calculate(2000, vars, 200, 6000);
    expect(cp).toBeGreaterThan(56);
    expect(cp).toBeLessThan(62);
  });

  it('enthalpy at 298.15 K matches the JANAF enthalpy of formation', () => {
    const row = janafGasRow('CO2', 298.15);
    expect(method.enthalpy(row.T, vars) / 1000).toBeCloseTo(row.dfH!, 0);
  });

  it('entropy at 298.15 K matches the JANAF row', () => {
    const row = janafGasRow('CO2', 298.15);
    expect(method.entropy(row.T, vars)).toBeCloseTo(row.S!, 0);
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
  const vars = compoundNasa7(N2)!.nasa7;

  it('Cp at 300 K matches the JANAF row', () => {
    expect(method.calculate(300, vars, 200, 6000)).toBeCloseTo(janafGasRow('N2', 300).Cp!, 0);
  });

  it('Cp at 1000 K matches the JANAF row (high-range coefficients)', () => {
    expect(method.calculate(1000, vars, 200, 6000)).toBeCloseTo(janafGasRow('N2', 1000).Cp!, 0);
  });

  it('enthalpy at 298.15 K is within ±500 J/mol of the JANAF enthalpy of formation', () => {
    const row = janafGasRow('N2', 298.15);
    expect(Math.abs(method.enthalpy(row.T, vars) - row.dfH! * 1000)).toBeLessThan(500);
  });

  it('entropy at 298.15 K matches the JANAF row', () => {
    const row = janafGasRow('N2', 298.15);
    expect(method.entropy(row.T, vars)).toBeCloseTo(row.S!, 0);
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
  const vars = compoundNasa7(N2)!.nasa7;

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

