import { EquationTypeDto } from '../../../../src/common/thermal/dto/equation-type.dto';
import { RefKey } from '../../../../src/common/thermal/enum/ref-key.enum';
import { CompoundValue } from '../../../../src/common/thermal/interfaces/compound-value.interface';
import { FLUID_REGISTRY } from '../../../../src/common/thermal/compound/gas';
import { PHYSICAL_CONSTANTS } from '../../../../src/common/thermal/constants/physical.constants';
import { GasPropertiesService } from '../../../../src/modules/thermodynamics/services/gas-properties.service';
import { TransportService } from '../../../../src/modules/thermodynamics/services/transport.service';
import { CompoundFluidPropsService } from '../../../../src/modules/thermodynamics/services/compound-fluid-props.service';
import { EUCKEN_FACTOR } from '../../../../src/modules/thermodynamics/constants/eucken-factor.constants';

/**
 * Characterization tests for CompoundFluidPropsService.
 * Golden values pinned before the helper → service move (Phase 2.2); kept identical after.
 */
describe('CompoundFluidPropsService', () => {
  const gasProps = new GasPropertiesService();
  const transport = new TransportService();
  const service = new CompoundFluidPropsService(gasProps, transport);
  const T_K = 500;
  const P_Pa = 101_325;

  it('pure N2: uses own Cp / μ / λ correlations (Sutherland preferred for μ)', () => {
    const props = service.resolve(FLUID_REGISTRY.N2, T_K, P_Pa);
    expect(props.M).toBe(FLUID_REGISTRY.N2.Mr);
    expect(props.Cp_J_molK).toBeCloseTo(29.58183144146953, 12);
    expect(props.Cp_J_kgK).toBeCloseTo(props.Cp_J_molK / props.M, 12);
    expect(props.mu_Pa_s).toBeCloseTo(0.000025804662940411834, 15);
    expect(props.lambda).toBeCloseTo(0.03890064012608694, 14);
    expect(props.rho_kg_m3).toBeCloseTo(gasProps.density(props.M, T_K, P_Pa), 12);
    expect(props.nu_m2s).toBeCloseTo(props.mu_Pa_s / props.rho_kg_m3, 15);
  });

  it('air mixture: empty viscosity bucket falls back to composition mix', () => {
    const props = service.resolve(FLUID_REGISTRY.air, T_K, P_Pa);
    expect(props.M).toBe(FLUID_REGISTRY.air.Mr);
    expect(props.Cp_J_molK).toBeCloseTo(29.820491178133896, 12);
    expect(props.mu_Pa_s).toBeCloseTo(0.000026893797524095055, 15);
    expect(props.lambda).toBeCloseTo(0.03940268879447267, 14);
    expect(props.mixtureValidity).toBeDefined();
  });

  it('Sutherland row on the compound is used when present', () => {
    const n2 = FLUID_REGISTRY.N2;
    const sutherland = n2.viscosity.values.find(v => v.type === EquationTypeDto.sutherland);
    expect(sutherland).toBeDefined();
    const props = service.resolve(n2, T_K, P_Pa);
    expect(props.mu_Pa_s).toBeCloseTo(0.000025804662940411834, 15);
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
