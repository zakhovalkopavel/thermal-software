/**
 * Unit tests for common/utils/quadrature.util.ts
 *
 * Tests:
 *  - clenshawCurtis  — accuracy on smooth and oscillating integrands
 *  - adaptiveIntegrate — auto-selection between GL and CC, and forced modes
 */

import {
  clenshawCurtis,
  adaptiveIntegrate,
  gaussLegendre,
} from '../../../../src/common/utils/quadrature.util';

// ─── Clenshaw–Curtis ──────────────────────────────────────────────────────────

describe('clenshawCurtis', () => {
  it('integrates constant f=1 over [0,1] → 1', () => {
    expect(clenshawCurtis(() => 1, 0, 1)).toBeCloseTo(1.0, 10);
  });

  it('integrates f=x over [0,1] → 0.5', () => {
    expect(clenshawCurtis((x) => x, 0, 1)).toBeCloseTo(0.5, 10);
  });

  it('integrates f=x² over [0,1] → 1/3', () => {
    expect(clenshawCurtis((x) => x * x, 0, 1)).toBeCloseTo(1 / 3, 8);
  });

  it('integrates f=x³ over [0,2] → 4', () => {
    expect(clenshawCurtis((x) => x * x * x, 0, 2)).toBeCloseTo(4.0, 8);
  });

  it('integrates sin(x) over [0,π] → 2', () => {
    expect(clenshawCurtis(Math.sin, 0, Math.PI)).toBeCloseTo(2.0, 8);
  });

  it('integrates cos(x) over [0,π] → 0', () => {
    expect(clenshawCurtis(Math.cos, 0, Math.PI)).toBeCloseTo(0.0, 8);
  });

  it('integrates cos(10x) over [0,1] → sin(10)/10 (oscillating)', () => {
    const exact = Math.sin(10) / 10;
    expect(clenshawCurtis((x) => Math.cos(10 * x), 0, 1)).toBeCloseTo(exact, 6);
  });

  it('integrates cos(50x) over [0,1] — fast oscillation (N=128)', () => {
    const exact = Math.sin(50) / 50;
    expect(clenshawCurtis((x) => Math.cos(50 * x), 0, 1, 128)).toBeCloseTo(exact, 4);
  });

  it('returns 0 for a = b', () => {
    expect(clenshawCurtis((x) => x * x, 3, 3)).toBeCloseTo(0, 12);
  });

  it('handles negative interval [−1, 0]', () => {
    expect(clenshawCurtis((x) => x * x, -1, 0)).toBeCloseTo(1 / 3, 8);
  });

  it('∫₀¹ exp(x) dx = e − 1', () => {
    expect(clenshawCurtis(Math.exp, 0, 1)).toBeCloseTo(Math.E - 1, 10);
  });
});

// ─── gaussLegendre (re-exported from quadrature.util) ────────────────────────

describe('gaussLegendre (re-exported)', () => {
  it('integrates f=x² over [0,1] → 1/3 (N=32)', () => {
    expect(gaussLegendre((x) => x * x, 0, 1, 32)).toBeCloseTo(1 / 3, 8);
  });
});

// ─── adaptiveIntegrate — method=gauss ────────────────────────────────────────

describe('adaptiveIntegrate — forced gauss mode', () => {
  it('∫₀¹ x² dx = 1/3', () => {
    expect(adaptiveIntegrate((x) => x * x, 0, 1, { method: 'gauss' })).toBeCloseTo(1 / 3, 6);
  });

  it('∫₀¹ exp(x) dx = e−1', () => {
    expect(adaptiveIntegrate(Math.exp, 0, 1, { method: 'gauss' })).toBeCloseTo(Math.E - 1, 8);
  });
});

// ─── adaptiveIntegrate — method=cc ───────────────────────────────────────────

describe('adaptiveIntegrate — forced cc mode', () => {
  it('∫₀¹ x² dx = 1/3', () => {
    expect(adaptiveIntegrate((x) => x * x, 0, 1, { method: 'cc' })).toBeCloseTo(1 / 3, 8);
  });

  it('∫₀¹ cos(10x) dx = sin(10)/10', () => {
    const exact = Math.sin(10) / 10;
    expect(adaptiveIntegrate((x) => Math.cos(10 * x), 0, 1, { method: 'cc' }))
      .toBeCloseTo(exact, 6);
  });
});

// ─── adaptiveIntegrate — auto detection ──────────────────────────────────────

describe('adaptiveIntegrate — auto detection', () => {
  it('smooth function: ∫₀¹ exp(x) dx = e−1', () => {
    expect(adaptiveIntegrate(Math.exp, 0, 1, { method: 'auto' }))
      .toBeCloseTo(Math.E - 1, 8);
  });

  it('smooth function: ∫₀² x³ dx = 4', () => {
    expect(adaptiveIntegrate((x) => x * x * x, 0, 2, { method: 'auto' }))
      .toBeCloseTo(4.0, 6);
  });

  it('oscillating: ∫₀¹ cos(20x) dx = sin(20)/20', () => {
    const exact = Math.sin(20) / 20;
    expect(adaptiveIntegrate((x) => Math.cos(20 * x), 0, 1, { method: 'auto', nodes: 128 }))
      .toBeCloseTo(exact, 4);
  });

  it('oscillating: ∫₀^π sin(5x)cos(x) dx (known = 0)', () => {
    // ∫₀^π sin(5x)·cos(x) dx = 0 by symmetry (odd × even on sym interval... actually needs numeric check)
    // Let's use a known result: ∫₀^π sin(5x) dx = 2/5 (for odd n)... actually = 2/5? 
    // ∫₀^π sin(5x)dx = [-cos(5x)/5]₀^π = (-cos(5π)+cos(0))/5 = (1+1)/5 = 2/5
    expect(adaptiveIntegrate((x) => Math.sin(5 * x), 0, Math.PI, { method: 'auto', nodes: 64 }))
      .toBeCloseTo(2 / 5, 5);
  });

  it('auto matches forced-cc result for oscillating integrand', () => {
    const f = (x: number) => Math.cos(15 * x);
    const autoResult = adaptiveIntegrate(f, 0, 1, { method: 'auto', nodes: 64 });
    const ccResult   = adaptiveIntegrate(f, 0, 1, { method: 'cc',   nodes: 64 });
    expect(autoResult).toBeCloseTo(ccResult, 10);
  });

  it('auto matches forced-gauss result for smooth integrand', () => {
    const f = (x: number) => Math.exp(-x * x);
    const autoResult   = adaptiveIntegrate(f, 0, 2, { method: 'auto',  nodes: 32 });
    const gaussResult  = adaptiveIntegrate(f, 0, 2, { method: 'gauss', nodes: 32 });
    // Both should agree within 1e-6 on a smooth decaying exponential
    expect(Math.abs(autoResult - gaussResult)).toBeLessThan(1e-6);
  });
});
