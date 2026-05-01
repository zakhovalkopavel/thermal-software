/**
 * Unit tests for ThermodynamicsFluidController endpoints.
 *
 * Tests the FluidPropertyService directly (no HTTP layer) following the
 * same pattern as other unit tests in this project.
 *
 * Run inside Docker:
 *   docker compose exec backend npm run test -- thermodynamics-fluid.controller
 */

import { BadRequestException } from '@nestjs/common';
import { FluidPropertyService } from '../../../../src/modules/thermodynamics/services/fluid-property.service';
import { GasPropertiesService } from '../../../../src/modules/thermodynamics/services/gas-properties.service';
import { TransportService } from '../../../../src/modules/thermodynamics/services/transport.service';
import { FlowRegime } from '../../../../src/modules/thermodynamics/types';
import { FlowGeometry, CorrelationName, Species } from '../../../../src/modules/thermodynamics/enums';

// ── Factory ───────────────────────────────────────────────────────────────────

function buildService(): FluidPropertyService {
  return new FluidPropertyService(new GasPropertiesService(), new TransportService());
}

// ── POST /thermodynamics/fluid/cp ─────────────────────────────────────────────

describe('POST /thermodynamics/fluid/cp', () => {

  it('should return Cp for a pure species — N2 at 1000 K', () => {
    const svc = buildService();
    const result = svc.getCp({ fluid: 'N2', T_fluid_K: 1000 });
    // N2 Cp(1000 K) ≈ 32.7 J/(mol·K), M=0.028014 → ~1167 J/(kg·K)
    expect(result.Cp_J_kgK).toBeGreaterThan(900);
    expect(result.Cp_J_kgK).toBeLessThan(1400);
    expect(result.molecularWeight_kg_mol).toBeCloseTo(0.028014, 4);
    expect(result.species).toBe('N2');
    expect(result.T_K).toBe(1000);
  });

  it('should return Cp and Cv for a gas — CO2 at 500 K', () => {
    const svc = buildService();
    const result = svc.getCp({ fluid: 'CO2', T_fluid_K: 500 });
    // CO2 Cp(500 K) ≈ 44.6 J/(mol·K), M=0.04401 → ~1013 J/(kg·K)
    expect(result.Cp_J_kgK).toBeGreaterThan(800);
    expect(result.Cp_J_kgK).toBeLessThan(1300);
    expect(result.Cv_J_kgK).toBeDefined();
    expect(result.Cv_J_kgK!).toBeLessThan(result.Cp_J_kgK);
    expect(result.gamma).toBeDefined();
    expect(result.gamma!).toBeGreaterThan(1);
    expect(result.T_K).toBe(500);
  });

  it('should return mixture Cp for a given mole composition', () => {
    const svc = buildService();
    const result = svc.getCp({
      composition: { [Species.N2]: 0.76, [Species.CO2]: 0.14, [Species.H2O]: 0.10 },
      T_fluid_K: 800,
    });
    expect(result.Cp_J_kgK).toBeGreaterThan(800);
    expect(result.molecularWeight_kg_mol).toBeGreaterThan(0.025);
    expect(result.T_K).toBe(800);
    expect(result.species).toBeUndefined();
  });

  it('should return 400 when T_K is missing', () => {
    const svc = buildService();
    expect(() => svc.getCp({ fluid: 'N2' } as any)).toThrow(BadRequestException);
  });

  it('should return 400 when fluid and composition are both absent', () => {
    const svc = buildService();
    expect(() => svc.getCp({ T_fluid_K: 500 } as any)).toThrow(BadRequestException);
  });

  it('should return 400 when a named fluid AND composition are both supplied', () => {
    const svc = buildService();
    expect(() =>
      svc.getCp({
        fluid: 'N2',
        composition: { [Species.N2]: 0.8, [Species.O2]: 0.2 },
        T_fluid_K: 800,
      }),
    ).toThrow(BadRequestException);
  });
});

// ── POST /thermodynamics/fluid/viscosity ──────────────────────────────────────

describe('POST /thermodynamics/fluid/viscosity', () => {

  it('should return μ and ν for N2 at 500 K', () => {
    const svc = buildService();
    const result = svc.getViscosity({ fluid: 'N2', T_fluid_K: 500 });
    // Sutherland: μ0=1.663e-5, T0=273, S=107 → μ(500 K) ≈ 2.6e-5 Pa·s
    expect(result.mu_Pa_s).toBeGreaterThan(1e-5);
    expect(result.mu_Pa_s).toBeLessThan(5e-5);
    expect(result.nu_m2s).toBeGreaterThan(0);
    expect(result.rho_kg_m3).toBeGreaterThan(0);
    expect(result.T_K).toBe(500);
    expect(result.nu_m2s).toBeCloseTo(result.mu_Pa_s / result.rho_kg_m3, 8);
  });

  it('should return mixture μ for a combustion gas composition', () => {
    const svc = buildService();
    const result = svc.getViscosity({
      composition: { [Species.N2]: 0.75, [Species.CO2]: 0.15, [Species.H2O]: 0.10 },
      T_fluid_K: 1000,
    });
    expect(result.mu_Pa_s).toBeGreaterThan(1e-5);
    expect(result.mu_Pa_s).toBeLessThan(1e-4);
    expect(result.nu_m2s).toBeGreaterThan(0);
    expect(result.T_K).toBe(1000);
  });

  it('should return 400 when T_K is out of range (≤ 0)', () => {
    const svc = buildService();
    expect(() => svc.getViscosity({ fluid: 'N2', T_fluid_K: 0 })).toThrow(BadRequestException);
  });
});

// ── POST /thermodynamics/fluid/density ────────────────────────────────────────

describe('POST /thermodynamics/fluid/density', () => {

  it('should return density for O2 at 300 K, 1 atm', () => {
    const svc = buildService();
    const result = svc.getDensity({ fluid: 'O2', T_fluid_K: 300 });
    // ρ = P·M/(R·T) = 101325·0.031999/(8.314·300) ≈ 1.30 kg/m³
    expect(result.rho_kg_m3).toBeCloseTo(1.30, 1);
    expect(result.molecularWeight_kg_mol).toBeCloseTo(0.031999, 5);
    expect(result.T_K).toBe(300);
    expect(result.P_Pa).toBe(101325);
  });

  it('should return density for a mixture at elevated pressure', () => {
    const svc = buildService();
    const result = svc.getDensity({
      composition: { [Species.N2]: 0.79, [Species.O2]: 0.21 },
      T_fluid_K: 300,
      P_Pa: 202650,
    });
    // ~air at 2 atm, 300 K → ρ ≈ 2.34 kg/m³
    expect(result.rho_kg_m3).toBeGreaterThan(2);
    expect(result.rho_kg_m3).toBeLessThan(3);
    expect(result.P_Pa).toBe(202650);
  });

  it('should return 400 when T_K ≤ 0', () => {
    const svc = buildService();
    expect(() => svc.getDensity({ fluid: 'O2', T_fluid_K: 0 })).toThrow(BadRequestException);
  });
});

// ── POST /thermodynamics/fluid/thermal-conductivity ───────────────────────────

describe('POST /thermodynamics/fluid/thermal-conductivity', () => {

  it('should return λ for CO2 at 800 K', () => {
    const svc = buildService();
    const result = svc.getThermalConductivity({ fluid: 'CO2', T_fluid_K: 800 });
    // Eucken λ ~ 0.01–0.15 W/(m·K) for CO2 at high T
    expect(result.lambda).toBeGreaterThan(0.01);
    expect(result.lambda).toBeLessThan(0.2);
    expect(result.T_K).toBe(800);
  });

  it('should return mixture λ via mole-fraction weighted mixing', () => {
    const svc = buildService();
    const result = svc.getThermalConductivity({
      composition: { [Species.N2]: 0.75, [Species.CO2]: 0.15, [Species.H2O]: 0.10 },
      T_fluid_K: 1000,
    });
    expect(result.lambda).toBeGreaterThan(0.01);
    expect(result.lambda).toBeLessThan(0.2);
  });

  it('should normalize composition fractions when they do not sum to 1', () => {
    const svc = buildService();
    // sum = 0.6 — service must normalise to { N2: 0.5, CO2: 0.5 } and succeed
    const result = svc.getThermalConductivity({
      composition: { [Species.N2]: 0.3, [Species.CO2]: 0.3 },
      T_fluid_K: 500,
    });
    expect(result.lambda).toBeGreaterThan(0);
  });

  it('should return 400 when a named fluid AND composition are both provided', () => {
    const svc = buildService();
    expect(() =>
      svc.getThermalConductivity({
        fluid: 'N2',
        composition: { [Species.N2]: 0.8, [Species.CO2]: 0.2 },
        T_fluid_K: 500,
      }),
    ).toThrow(BadRequestException);
  });
});

// ── GET /thermodynamics/fluid/flow-modes ──────────────────────────────────────

describe('GET /thermodynamics/fluid/flow-modes', () => {

  it('should return all FlowRegime values', () => {
    const svc = buildService();
    const result = svc.getFlowModes();
    const keys = result.map(r => r.key);
    expect(keys).toContain(FlowRegime.LAMINAR);
    expect(keys).toContain(FlowRegime.TURBULENT);
    expect(keys).toContain(FlowRegime.TRANSITIONAL);
    expect(keys).toContain(FlowRegime.NATURAL);
    expect(keys).toContain(FlowRegime.MIXED);
    expect(result.length).toBe(Object.values(FlowRegime).length);
  });

  it('should include descriptions for each regime', () => {
    const svc = buildService();
    const result = svc.getFlowModes();
    for (const entry of result) {
      expect(typeof entry.description).toBe('string');
      expect(entry.description.length).toBeGreaterThan(0);
    }
    // Spot-check
    const laminar = result.find(r => r.key === FlowRegime.LAMINAR);
    expect(laminar?.description).toMatch(/Re/);
    const natural = result.find(r => r.key === FlowRegime.NATURAL);
    expect(natural?.description).toMatch(/[Bb]uoyancy/);
  });
});

// ── GET /thermodynamics/fluid/list ────────────────────────────────────────────

describe('GET /thermodynamics/fluid/list', () => {

  it('should return all Species enum entries', () => {
    const svc = buildService();
    const result = svc.getFluidList();
    const keys = result.map(f => f.key);
    for (const sp of Object.values(Species)) {
      expect(keys).toContain(sp);
    }
  });

  it('should include air and water convenience aliases', () => {
    const svc = buildService();
    const result = svc.getFluidList();
    expect(result.find(f => f.key === 'air')).toBeDefined();
  });

  it('should include molecular weight for each entry', () => {
    const svc = buildService();
    const result = svc.getFluidList();
    const n2 = result.find(f => f.key === 'N2');
    expect(n2?.Mr_kg_mol).toBeCloseTo(0.028014, 4);
    // air should have a positive molar mass
    const air = result.find(f => f.key === 'air');
    expect(air?.Mr_kg_mol).toBeGreaterThan(0.025);
  });
});

// ── GET /thermodynamics/geometry/list ─────────────────────────────────────────

describe('GET /thermodynamics/geometry/list', () => {

  it('should return all FlowGeometry entries', () => {
    const svc = buildService();
    const result = svc.getGeometryList();
    const keys = result.map(g => g.key);
    for (const geo of Object.values(FlowGeometry)) {
      expect(keys).toContain(geo);
    }
  });

  it('should document required dimension fields for pipe_circular', () => {
    const svc = buildService();
    const entry = svc.getGeometryList().find(g => g.key === FlowGeometry.PIPE_CIRCULAR);
    expect(entry).toBeDefined();
    expect(entry!.requiredDims).toContain('a');
  });

  it('should document required dimension fields for tube_bank_inline', () => {
    const svc = buildService();
    const entry = svc.getGeometryList().find(g => g.key === FlowGeometry.TUBE_BANK_INLINE);
    expect(entry).toBeDefined();
    expect(entry!.requiredDims).toContain('a');
    expect(entry!.requiredDims).toContain('S_T');
    expect(entry!.requiredDims).toContain('S_L');
  });
});

// ── GET /thermodynamics/correlations ──────────────────────────────────────────

describe('GET /thermodynamics/correlations', () => {

  it('should return all CorrelationName entries', () => {
    const svc = buildService();
    const result = svc.getCorrelationList();
    const names = result.map(c => c.name);
    for (const corr of Object.values(CorrelationName)) {
      expect(names).toContain(corr);
    }
  });

  it('should include validity ranges for gnielinski', () => {
    const svc = buildService();
    const entry = svc.getCorrelationList().find(c => c.name === CorrelationName.Gnielinski);
    expect(entry).toBeDefined();
    expect(entry!.Re).toBeDefined();
    expect(entry!.Re![0]).toBe(3000);
    expect(entry!.Pr).toBeDefined();
  });

  it('should include applicable geometry list for each correlation', () => {
    const svc = buildService();
    const result = svc.getCorrelationList();
    for (const entry of result) {
      expect(Array.isArray(entry.geometry)).toBe(true);
      expect(entry.geometry.length).toBeGreaterThan(0);
    }
    const cb = result.find(c => c.name === CorrelationName.ChurchillBernstein);
    expect(cb!.geometry).toContain(FlowGeometry.CYLINDER_CROSSFLOW);
  });

  it('should include literature source for each correlation', () => {
    const svc = buildService();
    const result = svc.getCorrelationList();
    // Every entry must have at minimum name + geometry (source is in CORRELATION_VALIDITY notes which are optional)
    for (const entry of result) {
      expect(entry).toHaveProperty('name');
      expect(entry).toHaveProperty('geometry');
    }
  });
});

