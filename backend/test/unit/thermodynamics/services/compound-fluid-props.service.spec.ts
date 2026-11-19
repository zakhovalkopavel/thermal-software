import { EquationTypeDto } from '../../../../src/common/thermal/dto/equation-type.dto';
import { RefKey } from '../../../../src/common/thermal/enum/ref-key.enum';
import { CompoundValue } from '../../../../src/common/thermal/interfaces/compound-value.interface';
import { FLUID_REGISTRY } from '../../../../src/common/thermal/compound/gas';
import { PHYSICAL_CONSTANTS } from '../../../../src/common/thermal/constants/physical.constants';
import { CompoundPropertyResolver } from '../../../../src/common/thermal/utils/compound-properties/compound-property-resolver';
import { GasPropertiesService } from '../../../../src/modules/thermodynamics/services/gas-properties.service';
import { TransportService } from '../../../../src/modules/thermodynamics/services/transport.service';
import { CompoundFluidPropsService } from '../../../../src/modules/thermodynamics/services/compound-fluid-props.service';
import { EUCKEN_FACTOR } from '../../../../src/modules/thermodynamics/constants/eucken-factor.constants';
import { GasDensity } from '../../../../src/modules/thermodynamics/utils/density/gas-density';

/**
 * Characterization tests for CompoundFluidPropsService.
 * Viscosity follows compound-data `def` (Huber2019-ranked when available).
 */
describe('CompoundFluidPropsService', () => {
  const gasProps = new GasPropertiesService();
  const transport = new TransportService();
  const service = new CompoundFluidPropsService(gasProps, transport);
  const T_K = 500;
  const P_Pa = 101_325;

  it('pure N2: uses viscosity.def (Huber-ranked) for μ', () => {
    const n2 = FLUID_REGISTRY.N2;
    const expectedMu = new CompoundPropertyResolver(n2).viscosity(T_K);
    const props = service.resolve(n2, T_K, P_Pa);
    expect(props.M).toBe(n2.Mr);
    expect(props.Cp_J_molK).toBeCloseTo(29.58183144146953, 12);
    expect(props.Cp_J_kgK).toBeCloseTo(props.Cp_J_molK / props.M, 12);
    expect(props.mu_Pa_s).toBeCloseTo(expectedMu, 15);
    expect(n2.viscosity.values[n2.viscosity.def].type).toBe(EquationTypeDto.sutherland);
    expect(props.lambda).toBeCloseTo(0.03890064012608694, 14);
    expect(props.rho_kg_m3).toBeCloseTo(GasDensity.forCompound(n2, T_K, P_Pa), 12);
    expect(props.nu_m2s).toBeCloseTo(props.mu_Pa_s / props.rho_kg_m3, 15);
  });

  it('air mixture: empty viscosity bucket falls back to composition mix', () => {
    const props = service.resolve(FLUID_REGISTRY.air, T_K, P_Pa);
    const expectedMu = transport.viscosityMix(FLUID_REGISTRY.air.composition!, T_K);
    expect(props.M).toBe(FLUID_REGISTRY.air.Mr);
    expect(props.Cp_J_molK).toBeCloseTo(29.820491178133896, 12);
    expect(props.mu_Pa_s).toBeCloseTo(expectedMu, 15);
    expect(props.mixtureValidity).toBeDefined();
  });

  it('Ar uses Perry8 def even when a Sutherland row is present', () => {
    const ar = FLUID_REGISTRY.Ar;
    const defRow = ar.viscosity.values[ar.viscosity.def];
    expect(defRow.type).toBe(EquationTypeDto.dipprN102);
    expect(defRow.ref).toBe(RefKey.Perry8);
    expect(ar.viscosity.values.some(v => v.type === EquationTypeDto.sutherland)).toBe(true);
    const props = service.resolve(ar, T_K, P_Pa);
    expect(props.mu_Pa_s).toBeCloseTo(new CompoundPropertyResolver(ar).viscosity(T_K), 15);
    expect(props.mu_Pa_s).not.toBeCloseTo(
      new CompoundPropertyResolver(ar).viscosity(T_K, ar.viscosity.values.findIndex(
        v => v.type === EquationTypeDto.sutherland,
      )),
      8,
    );
  });

  it('Eucken fallback when λ bucket is empty and there is no composition', () => {
    const compound: CompoundValue = {
      name: 'EuckenStub',
      chemicalFormula: 'X',
      Mr: 0.028,
      enthalpyFormation298: 0,
      gibbsEnergy298: 0,
      heatCapacity: {
        def: 0,
        values: [{
          type: EquationTypeDto.linear,
          ref: RefKey.Borgnakke,
          vars: { a: 29, b: 0 },
          min: 200,
          max: 2000,
        }],
      },
      viscosity: {
        def: 0,
        values: [{
          type: EquationTypeDto.sutherland,
          ref: RefKey.White3,
          vars: { y0: 1.7e-5, T0: 273, S: 111 },
          min: 200,
          max: 2000,
        }],
      },
      thermalConductivity: { def: 0, values: [] },
    };

    const props = service.resolve(compound, T_K, P_Pa);
    const expectedLambda =
      (props.Cp_J_molK + EUCKEN_FACTOR * PHYSICAL_CONSTANTS.GAS_CONSTANT_J_MOLK)
      * props.mu_Pa_s / compound.Mr;
    expect(props.lambda).toBeCloseTo(expectedLambda, 15);
    expect(props.lambdaValidity.message).toMatch(/Eucken/i);
  });
});
