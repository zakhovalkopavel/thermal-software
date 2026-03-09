/**
 * Unit tests for glass-composition.util.ts
 *
 * Covers: wtPctToMolPct, molPctToWtPct
 */

import {
  wtPctToMolPct,
  molPctToWtPct,
} from '../../../../src/modules/refractory/utils/glass-composition.util';
import {
  FLUEGEL_VALIDATION_GLASSES,
} from '../../../../src/modules/refractory/data/glass-viscosity-validation.data';

// ─────────────────────────────────────────────────────────────────────────────

describe('glass-composition.util — wtPctToMolPct', () => {
  it('mol% values sum to 100', () => {
    const mol = wtPctToMolPct({ SiO2: 72.2, Na2O: 13.4, CaO: 11.2, MgO: 1.5, Al2O3: 1.7 });
    const sum = Object.values(mol).reduce((s, v) => s + v, 0);
    expect(sum).toBeCloseTo(100, 5);
  });

  it('heavier oxide (BaO, M=153) gives fewer mol% than lighter oxide (Na2O, M=62) at equal wt%', () => {
    const mol = wtPctToMolPct({ SiO2: 50, Na2O: 25, BaO: 25 });
    expect(mol['Na2O']).toBeGreaterThan(mol['BaO']!);
  });

  it('SiO₂ is dominant mol% in SLS glass', () => {
    const mol = wtPctToMolPct({ SiO2: 72.2, Na2O: 13.4, CaO: 11.2, MgO: 1.5, Al2O3: 1.7 });
    for (const [k, v] of Object.entries(mol)) {
      if (k !== 'SiO2') expect(mol['SiO2']).toBeGreaterThan(v);
    }
  });

  it('NIST SRM 710A wt% → mol% matches source Table 1 to ±0.05 mol%', () => {
    const glass = FLUEGEL_VALIDATION_GLASSES.find(g => g.id === 'NIST SRM 710A')!;
    const mol = wtPctToMolPct(glass.composition_wt_pct);
    const src = glass.composition_mol_pct as Record<string, number>;
    for (const [k, expected] of Object.entries(src)) {
      if ((expected as number) > 0) {
        expect(mol[k]).toBeCloseTo(expected as number, 1);
      }
    }
  });

  it('NIST SRM 711 (lead glass) wt% → mol% recovers PbO mol% correctly', () => {
    const glass = FLUEGEL_VALIDATION_GLASSES.find(g => g.id === 'NIST SRM 711')!;
    const mol = wtPctToMolPct(glass.composition_wt_pct);
    const src = glass.composition_mol_pct as Record<string, number>;
    // PbO is very heavy (M=223.20) so mol% << wt%
    expect(mol['PbO']).toBeCloseTo(src['PbO'], 1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('glass-composition.util — molPctToWtPct', () => {
  it('wt% values sum to 100', () => {
    const wt = molPctToWtPct({ SiO2: 74, Na2O: 15, CaO: 11 });
    const sum = Object.values(wt).reduce((s, v) => s + v, 0);
    expect(sum).toBeCloseTo(100, 5);
  });

  it('round-trip wtPct → molPct → wtPct is identity (±0.05 wt%)', () => {
    const original = { SiO2: 72.2, Na2O: 13.4, CaO: 11.2, MgO: 1.5, Al2O3: 1.7 };
    const mol = wtPctToMolPct(original);
    const recovered = molPctToWtPct(mol);
    for (const [k, v] of Object.entries(original)) {
      expect(recovered[k]).toBeCloseTo(v, 1);
    }
  });

  it('round-trip molPct → wtPct → molPct is identity (±0.05 mol%)', () => {
    const glass = FLUEGEL_VALIDATION_GLASSES.find(g => g.id === 'NIST SRM 710A')!;
    const original = glass.composition_mol_pct as Record<string, number>;
    const wt = molPctToWtPct(original);
    const recovered = wtPctToMolPct(wt);
    for (const [k, v] of Object.entries(original)) {
      if ((v as number) > 0) expect(recovered[k]).toBeCloseTo(v as number, 1);
    }
  });

  it('NIST SRM 711 mol% → wt% matches derived table (heavy PbO shifts wt% up)', () => {
    const glass = FLUEGEL_VALIDATION_GLASSES.find(g => g.id === 'NIST SRM 711')!;
    const wt = molPctToWtPct(glass.composition_mol_pct as Record<string, number>);
    const expected = glass.composition_wt_pct;
    for (const [k, v] of Object.entries(expected)) {
      expect(wt[k]).toBeCloseTo(v as number, 1);
    }
  });
});

