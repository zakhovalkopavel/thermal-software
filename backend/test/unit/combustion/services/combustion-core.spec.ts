import { GasPropertiesService } from '../../../../src/modules/thermodynamics/services/gas-properties.service';
import { Species } from '../../../../src/modules/thermodynamics/enums';
import { CombustionEnthalpyService } from '../../../../src/modules/combustion/services/combustion-enthalpy.service';
import { ProductEquilibriumService } from '../../../../src/modules/combustion/services/product-equilibrium.service';
import { FlameSolverService } from '../../../../src/modules/combustion/services/flame-solver.service';
import { CHARCOAL_BRIQUETTE, CHARCOAL_OAK, FUEL_REGISTRY } from '../../../../src/modules/combustion/data/fuels';
import { CondensedFuel } from '../../../../src/modules/combustion/interfaces';
import { FuelPhase } from '../../../../src/modules/combustion/enums/fuel-phase.enum';
import { airFlows, gasMassFlow } from '../../../../src/modules/combustion/utils/gas-flows';
import { elementsOfCondensed, elementsOfGas, stoichiometricO2 } from '../../../../src/modules/combustion/utils/element-balance';
import { ATOMIC_MASS, COMBUSTION } from '../../../../src/modules/combustion/constants';
import { RefKey } from '../../../../src/common/thermal/enum/ref-key.enum';

describe('Combustion core', () => {
  const gas = new GasPropertiesService();
  const enthalpy = new CombustionEnthalpyService(gas);
  const equilibrium = new ProductEquilibriumService(gas);
  const solver = new FlameSolverService(enthalpy, equilibrium);

  const pureCarbon = (lhv_J_kg: number): CondensedFuel => ({
    id: 'carbon', name: 'Carbon', phase: FuelPhase.Solid,
    elementalComp: { C: 1, H: 0, O: 0, N: 0, ash: 0 },
    lhv_J_kg, specificHeat_J_kgK: COMBUSTION.FUEL_CAPACITY_J_KGK,
  });

  describe('fuel data', () => {
    it('charcoal presets equal the legacy FuelDatabase.js records', () => {
      expect(CHARCOAL_BRIQUETTE).toMatchObject({
        elementalComp: { C: 0.85, H: 0.03, O: 0.10, N: 0.01, ash: 0.01 },
        porosity: 0.45, bulkDensity_kg_m3: 450, particleSize_m: 0.05, tortuosity: 3.0,
        activityFactor: 1.0, heatOfFormation_J_kg: -8500000, specificHeat_J_kgK: 1100,
        emissivity: 0.85, ref: RefKey.Basu2006, page: 67,
      });
      expect(CHARCOAL_OAK).toMatchObject({
        elementalComp: { C: 0.82, H: 0.04, O: 0.12, N: 0.01, ash: 0.01 },
        porosity: 0.50, bulkDensity_kg_m3: 380, particleSize_m: 0.03, tortuosity: 2.8,
        activityFactor: 1.1, heatOfFormation_J_kg: -8200000, specificHeat_J_kgK: 1050,
        emissivity: 0.83, ref: RefKey.VanKrevelen1993, page: 235,
      });
      expect(Object.keys(FUEL_REGISTRY)).toEqual(['charcoal-briquette', 'charcoal-oak', 'map-pro']);
    });
  });

  describe('element balance utils', () => {
    it('elementsOfGas separates inert argon', () => {
      const { elements, inerts } = elementsOfGas({ [Species.CH4]: 1, [Species.Ar]: 0.5 });
      expect(elements).toEqual({ C: 1, H: 4, O: 0, N: 0, S: 0 });
      expect(inerts).toEqual({ [Species.Ar]: 0.5 });
    });

    it('stoichiometric O2 of methane is 2 mol/mol', () => {
      expect(stoichiometricO2(elementsOfGas({ [Species.CH4]: 1 }).elements)).toBeCloseTo(2, 12);
    });

    it('airFlows keeps the O2/N2 ratio and humidity per dry-air mass', () => {
      const f = airFlows(1, 0.21, 0.01);
      expect(f[Species.N2]! / f[Species.O2]!).toBeCloseTo(0.79 / 0.21, 12);
      const mDry = 1 * gas.molecularWeight({ [Species.O2]: 1 }) + f[Species.N2]! * 0.0280134;
      expect(f[Species.H2O]! * 0.01801528).toBeCloseTo(0.01 * mDry, 5);
    });
  });

  describe('CombustionEnthalpyService', () => {
    it('charcoal LHV follows from the verified formation enthalpy', () => {
      const lhv = enthalpy.fuelLhv_Jkg(CHARCOAL_BRIQUETTE);
      const nC = 0.85 / ATOMIC_MASS.C;
      const nH2O = 0.03 / (2 * ATOMIC_MASS.H);
      const expected = -8_500_000 + (nC * 393_508 + nH2O * 241_825);
      expect(lhv).toBeCloseTo(expected, -3);
    });

    it('LHV-defined fuel round-trips through the formation enthalpy', () => {
      const fuel = pureCarbon(32_900_000);
      const dHf = enthalpy.fuelFormationEnthalpy_Jkg(fuel);
      expect(dHf - enthalpy.completeProductsFormation_Jkg(fuel.elementalComp)).toBeCloseTo(32_900_000, 3);
    });

    it('methane LHV ≈ 50.0 MJ/kg', () => {
      expect(enthalpy.gasFuelLhv_Jkg({ [Species.CH4]: 1 }) / 1e6).toBeCloseTo(50.0, 0);
    });
  });

  describe('ProductEquilibriumService', () => {
    const el = elementsOfCondensed(CHARCOAL_BRIQUETTE.elementalComp, 1);
    const o2St = stoichiometricO2(el);

    const withAir = (lambda: number) => {
      const air = elementsOfGas(airFlows(lambda * o2St, 0.21, 0)).elements;
      return { C: el.C + air.C, H: el.H + air.H, O: el.O + air.O, N: el.N + air.N, S: el.S + air.S };
    };

    it('lean: complete combustion, no CO/H2, surplus O2', () => {
      const p = equilibrium.solve(withAir(1.3), 1500);
      expect(p.gas[Species.CO] ?? 0).toBe(0);
      expect(p.gas[Species.H2] ?? 0).toBe(0);
      expect(p.gas[Species.O2]!).toBeCloseTo(0.3 * o2St, 9);
      expect(p.wgsKp).toBeNull();
    });

    it('rich: no O2, WGS satisfied', () => {
      const T = 1300;
      const p = equilibrium.solve(withAir(0.7), T);
      expect(p.gas[Species.O2] ?? 0).toBe(0);
      const g = p.gas;
      const Q = (g[Species.CO2]! * g[Species.H2]!) / (g[Species.CO]! * g[Species.H2O]!);
      expect(Q / equilibrium.wgsKp(T)).toBeCloseTo(1, 8);
    });

    it('very rich: char remains, all O as CO', () => {
      const p = equilibrium.solve(withAir(0.2), 1200);
      expect(p.charC_mols).toBeGreaterThan(0);
      expect(p.gas[Species.CO2] ?? 0).toBe(0);
      expect(p.gas[Species.H2O] ?? 0).toBe(0);
    });
  });

  describe('FlameSolverService', () => {
    it('pure carbon in O2 at λ = 1 releases −ΔHf(CO2)', () => {
      const fuel = { ...pureCarbon(0), lhv_J_kg: undefined, heatOfFormation_J_kg: 0 };
      const m = ATOMIC_MASS.C; // 1 mol/s C
      const out = solver.solveStep({
        condensed: { fuel, m_kgs: m, T_K: COMBUSTION.T_REF_K },
        gasStreams: [{ flows: { [Species.O2]: 1 }, T_K: COMBUSTION.T_REF_K }],
      });
      const sensible = gas.absoluteEnthalpy(Species.CO2, out.T_K) - gas.absoluteEnthalpy(Species.CO2, COMBUSTION.T_REF_K);
      expect(sensible).toBeCloseTo(393_508, -1);
      expect(out.products.gas[Species.CO2]!).toBeCloseTo(1, 12);
    });

    it('energy and element balances close', () => {
      const el = elementsOfCondensed(CHARCOAL_OAK.elementalComp, 0.01);
      const out = solver.solveStep({
        condensed: { fuel: CHARCOAL_OAK, m_kgs: 0.01, T_K: 298.15 },
        gasStreams: [{ flows: airFlows(0.8 * stoichiometricO2(el), 0.21, 0.01), T_K: 573 }],
        heatLoss_W: 5_000,
      });
      // residual expressed in kelvin with a conservative cp of 1000 J/(kg·K)
      const residual_W = Math.abs(out.productEnthalpy_W + out.heatLoss_W - out.reactantEnthalpy_W);
      expect(residual_W / (gasMassFlow(out.products.gas) * 1000)).toBeLessThan(0.01);
      expect(out.elementBalanceResidual).toBeLessThan(1e-9);
      expect(out.o2Supplied_mols / out.o2Stoich_mols).toBeCloseTo(0.8, 9);
    });
  });
});
