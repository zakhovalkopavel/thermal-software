import { GasPropertiesService } from '../../../../src/modules/thermodynamics/services/gas-properties.service';
import { TransportService } from '../../../../src/modules/thermodynamics/services/transport.service';
import { Species } from '../../../../src/modules/thermodynamics/enums';
import { CombustionEnthalpyService } from '../../../../src/modules/combustion/services/combustion-enthalpy.service';
import { ProductEquilibriumService } from '../../../../src/modules/combustion/services/product-equilibrium.service';
import { FlameSolverService } from '../../../../src/modules/combustion/services/flame-solver.service';
import { FluidCombustionService } from '../../../../src/modules/combustion/services/fluid-combustion.service';
import { FuelPhase } from '../../../../src/modules/combustion/enums/fuel-phase.enum';
import { FuelId } from '../../../../src/modules/combustion/enums/fuel-id.enum';
import { GAS_REGISTRY } from '../../../../src/common/thermal/compound/gas';
import { CompoundPropertyResolver } from '../../../../src/common/thermal/utils/compound-properties';

describe('Fuel gases (ethane … propylene) and MAP gas', () => {
  const gas = new GasPropertiesService();
  const transport = new TransportService();
  const enthalpy = new CombustionEnthalpyService(gas);
  const solver = new FlameSolverService(enthalpy, new ProductEquilibriumService(gas));
  const fluid = new FluidCombustionService(enthalpy, solver);

  // LHV [MJ/kg], gas phase, water as vapour — NIST WebBook / Engineering ToolBox
  it.each([
    [Species.C2H6, 47.5],
    [Species.C3H8, 46.35],
    [Species.C4H10, 45.75],
    [Species.iC4H10, 45.6],
    [Species.C2H2, 48.2],
    [Species.C3H6, 45.8],
  ])('LHV of %s within 1 %% of %d MJ/kg', (sp, lhv) => {
    const computed = enthalpy.gasFuelLhv_Jkg({ [sp]: 1 }) / 1e6;
    expect(Math.abs(computed - lhv) / lhv).toBeLessThan(0.01);
  });

  it('isomers share the formula but differ in formation enthalpy', () => {
    expect(gas.absoluteEnthalpy(Species.aC3H4, 298.15)).toBeGreaterThan(gas.absoluteEnthalpy(Species.C3H4, 298.15));
    expect(gas.absoluteEnthalpy(Species.iC4H10, 298.15)).toBeLessThan(gas.absoluteEnthalpy(Species.C4H10, 298.15));
  });

  it('Perry8 DIPPR 102 viscosity at 300 K close to literature values', () => {
    const cases: [Species, number][] = [
      [Species.C2H6, 9.4e-6], [Species.C3H8, 8.2e-6], [Species.C4H10, 7.5e-6], [Species.C2H2, 10.4e-6], [Species.C3H6, 8.6e-6],
    ];
    for (const [sp, mu] of cases) {
      const computed = new CompoundPropertyResolver(GAS_REGISTRY[sp]).viscosity(300);
      expect(Math.abs(computed - mu) / mu).toBeLessThan(0.05);
    }
  });

  // Eakin & Ellington 1963, Table 1: μ [μP] = B·T^1.5/(T + S), T and S in °R
  it.each([
    [Species.C2H6, 7.461, 466.2],
    [Species.C3H8, 6.805, 502.4],
    [Species.C4H10, 6.861, 600.0],
  ])('Sutherland of %s reproduces Eakin1963 B = %d, S = %d °R', (sp, B, S_R) => {
    for (const T_K of [250, 300, 500, 800]) {
      const T_R = 1.8 * T_K;
      const mu_paper = B * T_R ** 1.5 / (T_R + S_R) * 1e-7;
      expect(Math.abs(transport.viscosity(sp, T_K) / mu_paper - 1)).toBeLessThan(1e-4);
    }
  });

  it('gases without a published Sutherland constant are rejected by TransportService.viscosity', () => {
    for (const sp of [Species.iC4H10, Species.C2H2, Species.C3H4, Species.aC3H4, Species.C3H6]) {
      expect(() => transport.viscosity(sp, 300)).toThrow('No Sutherland parameters');
    }
  });

  it('propane: stoichiometric air ≈ 15.6 kg/kg, flame ≈ CH4 level; acetylene burns hotter', () => {
    const base = { phase: FuelPhase.Gas as const, fPower_W: 10_000, kExcessAir: 1, tAir_K: 293 };
    const propane = fluid.calculate({ ...base, fuelGas: { C3H8: 1 } });
    const acetylene = fluid.calculate({ ...base, fuelGas: { C2H2: 1 } });
    expect(propane.fuel.stoichAir_kgkg).toBeCloseTo(15.6, 1);
    expect(propane.tFlame_K).toBeGreaterThan(2250);
    expect(propane.tFlame_K).toBeLessThan(2450);
    expect(acetylene.tFlame_K).toBeGreaterThan(propane.tFlame_K + 150);
    expect(propane.combustion.elementBalanceResidual).toBeLessThan(1e-9);
  });

  it('MAP-Pro preset: propylene-based gas, same result as explicit mole fractions', () => {
    const base = { phase: FuelPhase.Gas as const, fPower_W: 5_000, kExcessAir: 1.05, tAir_K: 293 };
    const preset = fluid.calculate({ ...base, fuelId: FuelId.MapPro });
    const explicit = fluid.calculate({ ...base, fuelGas: { C3H6: 0.995, C3H8: 0.005 } });
    expect(preset.fuel.id).toBe(FuelId.MapPro);
    expect(preset.fuel.moleFractions?.C3H6).toBeCloseTo(0.995, 12);
    expect(preset.tFlame_K).toBeCloseTo(explicit.tFlame_K, 9);
    expect(preset.fuel.lhv_Jkg / 1e6).toBeCloseTo(45.8, 0);
  });

  it('classic MAPP-type blend (propyne/propadiene/propane) burns with closed balances', () => {
    const r = fluid.calculate({
      phase: FuelPhase.Gas, fPower_W: 5_000, kExcessAir: 1.1, tAir_K: 293,
      fuelGas: { C3H4: 0.45, aC3H4: 0.25, C3H8: 0.2, C4H10: 0.1 },
    });
    expect(r.combustion.elementBalanceResidual).toBeLessThan(1e-9);
    const s = r.combustion;
    expect(Math.abs(s.productEnthalpy_W + s.heatLoss_W - s.reactantEnthalpy_W) / (s.mGas_kgs * 1000)).toBeLessThan(0.01);
  });

  it('rejects a solid preset or both preset and mole fractions for gaseous fuel', () => {
    const base = { phase: FuelPhase.Gas as const, fPower_W: 5_000, kExcessAir: 1.1, tAir_K: 293 };
    expect(() => fluid.calculate({ ...base, fuelId: FuelId.CharcoalOak })).toThrow('not a gaseous fuel');
    expect(() => fluid.calculate({ ...base, fuelId: FuelId.MapPro, fuelGas: { CH4: 1 } })).toThrow('exactly one');
  });
});
