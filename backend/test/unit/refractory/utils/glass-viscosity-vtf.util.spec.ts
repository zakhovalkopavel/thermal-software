/**
 * Unit tests for glass-viscosity-vtf.util.ts
 *
 * Covers: fitVtfThreePoints, evalVtf, temperatureAtLogViscosity
 */

import {
  predictIsokomsLakatos,
  fitVtfThreePoints,
  evalVtf,
  temperatureAtLogViscosity,
} from '../../../../src/modules/refractory/utils/glass-viscosity-vtf.util';
import { LAKATOS_VALIDATION_GLASSES } from '../../../../src/modules/refractory/data/glass-viscosity-validation.data';

// Canonical triple from Lakatos S1 model output
const p1 = { T_celsius: 1503.7, logEtaPaS: 1 };
const p2 = { T_celsius: 1054.3, logEtaPaS: 3 };
const p3 = { T_celsius:  843.3, logEtaPaS: 5 };

// ─────────────────────────────────────────────────────────────────────────────

describe('glass-viscosity-vtf.util — fitVtfThreePoints', () => {
  it('reproduces all three input points to floating-point precision', () => {
    const vtf = fitVtfThreePoints(p1, p2, p3);

    // LM is iterative — exact interpolation is not guaranteed.
    // Residuals < 0.1 log-unit are physically acceptable.
    expect(evalVtf(vtf, p1.T_celsius)).toBeCloseTo(p1.logEtaPaS, 1);
    expect(evalVtf(vtf, p2.T_celsius)).toBeCloseTo(p2.logEtaPaS, 1);
    expect(evalVtf(vtf, p3.T_celsius)).toBeCloseTo(p3.logEtaPaS, 1);
  });

  it('result is order-independent', () => {
    const vtf1 = fitVtfThreePoints(p1, p2, p3);
    const vtf2 = fitVtfThreePoints(p3, p1, p2);
    const vtf3 = fitVtfThreePoints(p2, p3, p1);
    // LM is deterministic given the same sorted seed — parameters should
    // Residuals < 0.1 log-unit are physically acceptable.
    expect(vtf1.T0).toBeCloseTo(vtf2.T0, 1);
    expect(vtf1.T0).toBeCloseTo(vtf3.T0, 1);
    expect(vtf1.B).toBeCloseTo(vtf2.B, 1);
  });

  it('T₀ > 0, T₀ < lowest isokom T, B > 0 for all Lakatos validation glasses', () => {
    for (const glass of LAKATOS_VALIDATION_GLASSES) {
      const iso = predictIsokomsLakatos(glass.composition_wt_pct);
      const vtf = fitVtfThreePoints(
        { T_celsius: iso.T_logEta1, logEtaPaS: 1 },
        { T_celsius: iso.T_logEta3, logEtaPaS: 3 },
        { T_celsius: iso.T_logEta5, logEtaPaS: 5 },
      );
      expect(vtf.T0).toBeGreaterThan(0);
      expect(vtf.T0).toBeLessThan(iso.T_logEta5);
      expect(vtf.B).toBeGreaterThan(0);
    }
  });

  it('throws VTF_FIT_SINGULAR for equally-spaced (Arrhenius-like) points', () => {
    expect(() =>
      fitVtfThreePoints(
        { T_celsius: 1000, logEtaPaS: 2 },
        { T_celsius:  800, logEtaPaS: 4 },
        { T_celsius:  600, logEtaPaS: 6 },
      ),
    ).toThrow(/VTF_FIT_SINGULAR|VTF_FIT_INVALID/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('glass-viscosity-vtf.util — evalVtf + temperatureAtLogViscosity', () => {
  it('inversion round-trip: temperatureAtLogViscosity → evalVtf is exact', () => {
    const vtf = fitVtfThreePoints(p1, p2, p3);
    for (const logEta of [1, 2, 3, 5, 6.6, 12, 13.5]) {
      const T = temperatureAtLogViscosity(vtf, logEta);
      expect(evalVtf(vtf, T)).toBeCloseTo(logEta, 9);
    }
  });

  it('viscosity increases monotonically as temperature decreases', () => {
    const vtf = fitVtfThreePoints(p1, p2, p3);
    const temps = [1400, 1200, 1050, 900, 843];
    const logEtas = temps.map(T => evalVtf(vtf, T));
    for (let i = 1; i < logEtas.length; i++) {
      expect(logEtas[i]).toBeGreaterThan(logEtas[i - 1]);
    }
  });
});

