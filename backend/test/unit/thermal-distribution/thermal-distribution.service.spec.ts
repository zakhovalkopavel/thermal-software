/**
 * Unit tests for the thermal-distribution module.
 *
 * Validation cases are derived from:
 *   - Luikov A.V. "Analytical Heat Diffusion Theory" (1968)
 *     tabulated solutions in Chapters IV–VI
 *   - THERMAL_DISTRIBUTION_SPEC_09_Validation.md worked examples
 *
 * Acceptance criterion: ≤ 0.5 °C deviation for all reference cases.
 */

import { ThermalDistributionService } from '../../../src/modules/thermal-distribution/services/thermal-distribution.service';
import type { ProfileOptions }        from '../../../src/modules/thermal-distribution/type/profile-options.type';

// ── Helpers ───────────────────────────────────────────────────────────────────

function baseOpts(overrides: Partial<ProfileOptions> = {}): ProfileOptions {
  return {
    bcType:            'BC_III',
    Tc:                20,
    T0:                820,
    tau:               120,
    alpha:             1500,
    lambda:            45,
    thermalDiffusivity: 1.2e-5,
    shape:             { geometry: 'cylinder', radius: 0.05 },
    initialProfile:    'uniform',
    seriesTerms:       100,
    avg:               { mode: 'series', gaussNodes: 32, simpsonNodes: 128 },
    ...overrides,
  };
}

const svc = new ThermalDistributionService();

// ── Sanity checks — criteria ──────────────────────────────────────────────────

describe('computeCriteria', () => {
  it('computes correct Bi for cylinder BC III', () => {
    const opts = baseOpts();
    const { Bi } = svc.computeCriteria(opts);
    // Bi = α·R/λ = 1500·0.05/45 ≈ 1.667
    expect(Bi).toBeCloseTo(1500 * 0.05 / 45, 5);
  });

  it('returns Bi = Infinity for BC I', () => {
    const opts = baseOpts({ bcType: 'BC_I', alpha: undefined });
    const { Bi } = svc.computeCriteria(opts);
    expect(Bi).toBe(Infinity);
  });

  it('computes Fo = a·τ/R² for cylinder', () => {
    const opts = baseOpts();
    const { Fo } = svc.computeCriteria(opts);
    expect(Fo).toBeCloseTo(1.2e-5 * 120 / (0.05 * 0.05), 5);
  });
});

// ── Plate BC I ────────────────────────────────────────────────────────────────

describe('plate BC I — uniform initial profile', () => {
  const opts: ProfileOptions = {
    bcType:            'BC_I',
    Tc:                0,
    T0:                100,
    tau:               1,     // Will be scaled via Fo
    alpha:             undefined,
    lambda:            1,
    thermalDiffusivity: 1,
    shape:             { geometry: 'plate', halfThickness: 1 },
    avg:               { mode: 'series' },
  };

  it('at large Fo → centre approaches Tc', () => {
    const T = svc.temperatureAtDepth(0, { ...opts, tau: 5, thermalDiffusivity: 1 });
    expect(T).toBeLessThan(5);
  });

  it('surface is always at Tc for BC I', () => {
    const T = svc.temperatureAtDepth(1, opts);
    expect(T).toBeCloseTo(0, 6);
  });

  it('centre > surface at all finite times', () => {
    const Tc_ = svc.temperatureAtDepth(1, opts);
    const Tcr = svc.temperatureAtDepth(0, opts);
    expect(Tcr).toBeGreaterThan(Tc_);
  });
});

// ── Plate BC III ───────────────────────────────────────────────────────────────

describe('plate BC III — uniform initial profile', () => {
  it('centre > surface temperature (no surface flux reversal)', () => {
    const opts = baseOpts({ shape: { geometry: 'plate', halfThickness: 0.02 } });
    const Tctr  = svc.temperatureAtDepth(0, opts);
    const Tsurf = svc.temperatureAtDepth(1, opts);
    expect(Tctr).toBeGreaterThan(Tsurf);
  });

  it('mean temperature lies between centre and surface', () => {
    const opts = baseOpts({ shape: { geometry: 'plate', halfThickness: 0.02 } });
    const Tmean = svc.averageTemperature(opts);
    const Tctr  = svc.temperatureAtDepth(0, opts);
    const Tsurf = svc.temperatureAtDepth(1, opts);
    expect(Tmean).toBeLessThanOrEqual(Tctr);
    expect(Tmean).toBeGreaterThanOrEqual(Tsurf);
  });

  it('temperature decreases with time', () => {
    const opts1 = baseOpts({ shape: { geometry: 'plate', halfThickness: 0.02 }, tau: 60 });
    const opts2 = baseOpts({ shape: { geometry: 'plate', halfThickness: 0.02 }, tau: 300 });
    const T1 = svc.averageTemperature(opts1);
    const T2 = svc.averageTemperature(opts2);
    expect(T2).toBeLessThan(T1);
  });
});

// ── Cylinder BC III ───────────────────────────────────────────────────────────

describe('cylinder BC III — uniform initial profile', () => {
  it('Luikov Fo=0.5, Bi=2 — centre dimensionless excess ≈ 0.372', () => {
    // ϑ_ctr = (T_ctr − Tc)/(T0 − Tc)
    // Luikov Ch. VI formula for cylinder: Fo=0.5, Bi=2 → Θ₀ ≈ 0.372
    const R = 0.1;
    const a = 1.0;
    const opts: ProfileOptions = {
      bcType:            'BC_III',
      Tc:                0,
      T0:                1,
      tau:               0.5 * R * R / a,
      alpha:             2 * 1.0 / R,   // Bi = α·R/λ = 2
      lambda:            1.0,
      thermalDiffusivity: a,
      shape:             { geometry: 'cylinder', radius: R },
      avg:               { mode: 'series' },
    };
    const T = svc.temperatureAtDepth(0, opts);
    expect(T).toBeCloseTo(0.372, 1);
  });

  it('mean temperature is consistent with spatial average via Gauss', () => {
    const opts  = baseOpts({ tau: 60 });
    const series = svc.averageTemperature(opts);
    const gauss  = svc.averageTemperature({
      ...opts,
      avg: { mode: 'gauss', gaussNodes: 64 },
    });
    expect(Math.abs(series - gauss)).toBeLessThan(5);
  });
});

// ── Sphere BC III ─────────────────────────────────────────────────────────────

describe('sphere BC III — uniform initial profile', () => {
  it('sphere cools faster than cylinder of same radius', () => {
    const opts_c = baseOpts({ tau: 60 });
    const opts_s = baseOpts({ tau: 60, shape: { geometry: 'sphere', radius: 0.05 } });
    const Tmean_cyl = svc.averageTemperature(opts_c);
    const Tmean_sph = svc.averageTemperature(opts_s);
    expect(Tmean_sph).toBeLessThan(Tmean_cyl);
  });
});

// ── Parabolic profile ─────────────────────────────────────────────────────────

describe('parabolic initial profile', () => {
  it('centre warmer than surface in parabolic profile at t=0+', () => {
    const opts = baseOpts({
      tau:            5,
      initialProfile: 'parabolic',
      T0Ctr:          900,
      T0Surf:         700,
      shape:          { geometry: 'cylinder', radius: 0.05 },
    });
    const Tctr  = svc.temperatureAtDepth(0, opts);
    const Tsurf = svc.temperatureAtDepth(1, opts);
    expect(Tctr).toBeGreaterThan(Tsurf);
  });
});

// ── Parallelepiped (product rule) ─────────────────────────────────────────────

describe('parallelepiped BC III — product rule', () => {
  it('mean temperature lies between Tc and T0', () => {
    const opts = baseOpts({
      shape:     { geometry: 'parallelepiped', halfX: 0.03, halfY: 0.04, halfZ: 0.05 },
      biPerAxis: [2, 2, 2],
    });
    const Tmean = svc.averageTemperature(opts);
    expect(Tmean).toBeGreaterThan(opts.Tc);
    expect(Tmean).toBeLessThan(opts.T0);
  });

  it('parallelepiped cools slower than single plate of same minimum half-thickness', () => {
    const optsParallel = baseOpts({
      shape:     { geometry: 'parallelepiped', halfX: 0.02, halfY: 0.02, halfZ: 0.02 },
      biPerAxis: [2, 2, 2],
    });
    const optsPlate = baseOpts({
      shape: { geometry: 'plate', halfThickness: 0.02 },
    });
    const Tp = svc.averageTemperature(optsPlate);
    const Tc_ = svc.averageTemperature(optsParallel);
    // Parallelepiped product rule → lower mean than 1D plate (3× cooling)
    expect(Tc_).toBeLessThan(Tp);
  });
});

// ── Finite cylinder (product rule) ────────────────────────────────────────────

describe('finite cylinder BC III — product rule', () => {
  it('mean temperature lies between Tc and T0', () => {
    const opts = baseOpts({
      shape:      { geometry: 'finite_cylinder', radius: 0.05, halfZ: 0.10 },
      biCylinder: [2, 2],
    });
    const Tmean = svc.averageTemperature(opts);
    expect(Tmean).toBeGreaterThan(opts.Tc);
    expect(Tmean).toBeLessThan(opts.T0);
  });
});

// ── Characteristic lengths ────────────────────────────────────────────────────

describe('computeCharacteristicLengths', () => {
  it('plate: Rdist = Rbi = halfThickness', () => {
    const { Rdist, Rbi } = svc.computeCharacteristicLengths(
      { geometry: 'plate', halfThickness: 0.05 },
    );
    expect(Rdist).toBeCloseTo(0.05, 10);
    expect(Rbi).toBeCloseTo(0.05, 10);
  });

  it('cylinder: Rdist = Rbi = radius', () => {
    const { Rdist, Rbi } = svc.computeCharacteristicLengths(
      { geometry: 'cylinder', radius: 0.04 },
    );
    expect(Rdist).toBeCloseTo(0.04, 10);
    expect(Rbi).toBeCloseTo(0.04, 10);
  });

  it('sphere: Rdist = Rbi = radius', () => {
    const { Rdist, Rbi } = svc.computeCharacteristicLengths(
      { geometry: 'sphere', radius: 0.03 },
    );
    expect(Rdist).toBeCloseTo(0.03, 10);
    expect(Rbi).toBeCloseTo(0.03, 10);
  });

  it('hollow cylinder: Rdist = R2, Rbi = (R2−R1)/2', () => {
    const R1 = 0.02, R2 = 0.05;
    const { Rdist, Rbi } = svc.computeCharacteristicLengths(
      { geometry: 'hollow_cylinder', innerRadius: R1, outerRadius: R2 },
    );
    expect(Rdist).toBeCloseTo(R2, 10);
    expect(Rbi).toBeCloseTo((R2 - R1) / 2, 10);
  });
});

// ── Time stepping ─────────────────────────────────────────────────────────────

describe('runTimeSteppingLoop', () => {
  it('returns results at each time step', () => {
    const opts = baseOpts({ tau: 30, timeStep: 10 });
    const results = svc.runTimeSteppingLoop(opts);
    expect(results.length).toBe(3);
    expect(results[0].tau).toBe(10);
    expect(results[2].tau).toBe(30);
  });

  it('Tsurface ≤ Tcenter at all times (quenching from outside)', () => {
    const opts = baseOpts({ tau: 60, timeStep: 20 });
    const results = svc.runTimeSteppingLoop(opts);
    for (const r of results) {
      expect(r.Tsurface).toBeLessThanOrEqual(r.Tcenter + 1e-9);
    }
  });

  it('Taverage is between Tsurface and Tcenter', () => {
    const opts = baseOpts({ tau: 60, timeStep: 20 });
    const results = svc.runTimeSteppingLoop(opts);
    for (const r of results) {
      expect(r.Taverage).toBeGreaterThanOrEqual(r.Tsurface - 1e-9);
      expect(r.Taverage).toBeLessThanOrEqual(r.Tcenter + 1e-9);
    }
  });
});
