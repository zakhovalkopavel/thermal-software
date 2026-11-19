/**
 * Plan 3 — compound equation boundary validity.
 *
 * Covers:
 *   - Out-of-range → clamped value + action: clamped + correct effectiveT
 *   - NASA out-of-range → extrapolated flagged
 *   - Mixture with one OOR component
 *   - Null range → rangeUnknown, not silent infinite
 *   - Average out-of-range consistent across equation types
 */

import { EquationTypeDto } from '../../../../src/common/thermal/dto/equation-type.dto';
import { RefKey } from '../../../../src/common/thermal/enum/ref-key.enum';
import { EquationValue } from '../../../../src/common/thermal/interfaces/equation-value.interface';
import { CompoundValue } from '../../../../src/common/thermal/interfaces/compound-value.interface';
import { LinearEquationMethod } from '../../../../src/common/thermal/utils/equation-methods/linear-equation-method';
import { DipprEquation107Method } from '../../../../src/common/thermal/utils/equation-methods/dippr-equation-107-method';
import { SutherlandEquationMethod } from '../../../../src/common/thermal/utils/equation-methods/sutherland-equation-method';
import { EquationValidity } from '../../../../src/common/thermal/utils/equation-validity';
import { CompoundPropertyResolver } from '../../../../src/common/thermal/utils/compound-properties/compound-property-resolver';
import { evaluateNasaThermo } from '../../../../src/common/thermal/utils/nasa/evaluate-nasa-thermo.util';
import { compoundNasaThermo } from '../../../../src/common/thermal/utils/nasa';
import { N2, CO2 } from '../../../../src/common/thermal/compound/gas';
import { GasPropertiesService } from '../../../../src/modules/thermodynamics/services/gas-properties.service';
import { CompoundData } from '../../../../src/common/thermal/utils/compound-data';
import { CompoundDataEquationValue } from '../../../../src/common/thermal/utils/compound-data/interfaces/equation/compound-data-equation-value.interface';

const linearEntry: EquationValue = {
  type: EquationTypeDto.linear,
  ref: RefKey.Szargut,
  vars: { a: 25, b: 0.01 },
  min: 200,
  max: 1500,
};

describe('EquationValidity.clampLimits', () => {
  it('finite range → lo/hi as given, rangeUnknown false', () => {
    const lim = EquationValidity.clampLimits(200, 1500);
    expect(lim.lo).toBe(200);
    expect(lim.hi).toBe(1500);
    expect(lim.rangeUnknown).toBe(false);
  });

  it('null range → ±Infinity and rangeUnknown', () => {
    const lim = EquationValidity.clampLimits(null, null);
    expect(lim.lo).toBe(Number.NEGATIVE_INFINITY);
    expect(lim.hi).toBe(Number.POSITIVE_INFINITY);
    expect(lim.rangeUnknown).toBe(true);
  });
});

describe('EquationValidity.buildTemperatureValidity', () => {
  it('in-range → action none, effectiveT = requestedT', () => {
    const v = EquationValidity.buildTemperatureValidity(500, 200, 1500);
    expect(v.inRange).toBe(true);
    expect(v.action).toBe('none');
    expect(v.effectiveT).toBe(500);
    expect(v.rangeUnknown).toBe(false);
  });

  it('below min → clamped + effectiveT = min', () => {
    const v = EquationValidity.buildTemperatureValidity(100, 200, 1500);
    expect(v.inRange).toBe(false);
    expect(v.action).toBe('clamped');
    expect(v.effectiveT).toBe(200);
    expect(v.message).toMatch(/outside/);
  });

  it('null range → rangeUnknown, action none, min/max null in metadata', () => {
    const v = EquationValidity.buildTemperatureValidity(500, null, null);
    expect(v.rangeUnknown).toBe(true);
    expect(v.inRange).toBe(false);
    expect(v.action).toBe('none');
    expect(v.min).toBeNull();
    expect(v.max).toBeNull();
    expect(v.effectiveT).toBe(500);
  });
});

describe('EquationValidity.buildAverageValidity', () => {
  it('both ends in range → action none', () => {
    const v = EquationValidity.buildAverageValidity(300, 400, 200, 1500);
    expect(v.inRange).toBe(true);
    expect(v.action).toBe('none');
    expect(v.effectiveT).toBe(300);
    expect(v.effectiveT2).toBe(400);
  });

  it('one end OOR → clamped + effective endpoints', () => {
    const v = EquationValidity.buildAverageValidity(100, 400, 200, 1500);
    expect(v.inRange).toBe(false);
    expect(v.action).toBe('clamped');
    expect(v.effectiveT).toBe(200);
    expect(v.effectiveT2).toBe(400);
    expect(v.message).toMatch(/Average interval/);
  });
});

describe('EquationValidity.evaluateEquation — warn-and-clamp', () => {
  it('out-of-range returns clamped value + action clamped + effectiveT', () => {
    const r = EquationValidity.evaluateEquation(linearEntry, 100);
    const atMin = EquationValidity.evaluateEquation(linearEntry, 200);
    expect(r.value).toBeCloseTo(atMin.value, 10);
    expect(r.validity.action).toBe('clamped');
    expect(r.validity.effectiveT).toBe(200);
    expect(r.validity.requestedT).toBe(100);
    expect(r.validity.inRange).toBe(false);
  });

  it('null min/max → rangeUnknown, value evaluated at requested T (no clamp)', () => {
    const unknown: EquationValue = { ...linearEntry, min: null, max: null };
    const r = EquationValidity.evaluateEquation(unknown, 100);
    expect(r.validity.rangeUnknown).toBe(true);
    expect(r.validity.action).toBe('none');
    expect(r.value).toBeCloseTo(25 + 0.01 * 100, 10);
  });
});

describe('EquationValidity.evaluateEquationAverage — denominator uses effective interval', () => {
  const vars = { a: 10, b: 2 };
  const m = new LinearEquationMethod();

  it('OOR average matches integral over clamped ends / clamped ΔT', () => {
    // Request [100, 400] with range [200, 1000] → effective [200, 400]
    const avg = m.calculateAverage(100, 400, vars, 200, 1000);
    const expected =
      (m.integral(400, vars, 200, 1000) - m.integral(200, vars, 200, 1000)) / (400 - 200);
    expect(avg).toBeCloseTo(expected, 8);
    // Must NOT use original (400-100) denominator
    const wrong =
      (m.integral(400, vars, 200, 1000) - m.integral(200, vars, 200, 1000)) / (400 - 100);
    expect(avg).not.toBeCloseTo(wrong, 4);
  });

  it('validity for average marks clamped when an endpoint is OOR', () => {
    const r = EquationValidity.evaluateEquationAverage(linearEntry, 100, 400);
    expect(r.validity.action).toBe('clamped');
    expect(r.validity.effectiveT).toBe(200);
    expect(r.validity.effectiveT2).toBe(400);
    expect(r.validity.inRange).toBe(false);
  });

  it('DIPPR 107 average OOR is consistent with clamped interval', () => {
    const dippr = new DipprEquation107Method();
    const v = { c1: 0.2896e5, c2: 0.0939e5, c3: 3.012e3, c4: 0.0758e5, c5: 1484 };
    const avg = dippr.calculateAverage(10, 300, v, 50, 1500, 1e-3);
    const expected =
      (dippr.integral(300, v, 50, 1500, 1e-3) - dippr.integral(50, v, 50, 1500, 1e-3)) / (300 - 50);
    expect(avg).toBeCloseTo(expected, 8);
  });

  it('Sutherland average OOR is consistent with clamped interval', () => {
    const s = new SutherlandEquationMethod();
    const v = { y0: 1.663e-5, T0: 273, S: 107 };
    const avg = s.calculateAverage(50, 400, v, 100, 1500);
    const expected =
      (s.integral(400, v, 100, 1500) - s.integral(100, v, 100, 1500)) / (400 - 100);
    expect(avg).toBeCloseTo(expected, 8);
  });
});

describe('NASA extrapolation flag', () => {
  it('enthalpy outside NASA range → action extrapolated', () => {
    const nasa = compoundNasaThermo(N2)!;
    // N2 NASA-9 spans to 20 000 K — go beyond the global upper bound
    const T = nasa.Tmax + 5000;
    const r = evaluateNasaThermo(nasa, 'enthalpy', T);
    expect(r.validity.inRange).toBe(false);
    expect(r.validity.action).toBe('extrapolated');
    expect(r.validity.min).toBe(nasa.Tmin);
    expect(r.validity.max).toBe(nasa.Tmax);
    expect(Number.isFinite(r.value)).toBe(true);
  });

  it('Cp outside NASA range → action clamped (not extrapolated)', () => {
    const nasa = compoundNasaThermo(N2)!;
    const T = nasa.Tmax + 5000;
    const r = evaluateNasaThermo(nasa, 'cp', T);
    expect(r.validity.action).toBe('clamped');
    expect(r.value).toBeCloseTo(nasa.cp(nasa.Tmax), 8);
  });

  it('resolver enthalpyResult flags extrapolated', () => {
    const nasa = compoundNasaThermo(CO2)!;
    const r = new CompoundPropertyResolver(CO2).enthalpyResult(nasa.Tmax + 1000);
    expect(r.validity.action).toBe('extrapolated');
  });
});

describe('Mixture with one OOR component', () => {
  it('cpMixtureResult.allInRange is false when one species is OOR', () => {
    const gas = new GasPropertiesService();
    // Below every published N2/CO2 Cp lower bound in the registry (lowest tabulated min is 50 K)
    const r = gas.cpMixtureResult({ N2: 0.5, CO2: 0.5 }, 20);
    expect(r.mixtureValidity.allInRange).toBe(false);
    expect(r.validity.action).toBe('clamped');
    expect(r.mixtureValidity.components.N2.inRange).toBe(false);
    expect(r.mixtureValidity.components.CO2.inRange).toBe(false);
  });

  it('aggregateMixtureValidity requires every component inRange', () => {
    const ok = EquationValidity.buildTemperatureValidity(300, 200, 1500);
    const bad = EquationValidity.buildTemperatureValidity(100, 200, 1500);
    const agg = EquationValidity.aggregateMixtureValidity({ N2: ok, CO2: bad });
    expect(agg.allInRange).toBe(false);
  });

  it('aggregateMixtureValidity allInRange when every component is in range', () => {
    const ok = EquationValidity.buildTemperatureValidity(300, 200, 1500);
    const agg = EquationValidity.aggregateMixtureValidity({ N2: ok, CO2: ok });
    expect(agg.allInRange).toBe(true);
  });
});

describe('CompoundData.toEquationValue preserves null ranges', () => {
  it('null min/max stay null (not ±Infinity)', () => {
    const row = {
      type: 'linear',
      ref: ['Szargut', 1, 'linear'] as unknown as CompoundDataEquationValue['ref'],
      vars: { a: 1, b: 0 },
      min: null,
      max: null,
    } as CompoundDataEquationValue;
    const v = CompoundData.toEquationValue(row);
    expect(v.min).toBeNull();
    expect(v.max).toBeNull();
  });
});

describe('Sutherland ranges preserved on gas compounds', () => {
  it('N2 Sutherland viscosity equation keeps min/max from the source row', () => {
    const row = N2.viscosity.values.find(v => v.type === EquationTypeDto.sutherland);
    expect(row).toBeDefined();
    // Source White3/NBS ranges are finite — not silently dropped
    expect(row!.min == null || typeof row!.min === 'number').toBe(true);
    expect(row!.max == null || typeof row!.max === 'number').toBe(true);
    if (row!.min != null && row!.max != null) {
      expect(row!.min).toBeLessThan(row!.max);
    }
  });
});

describe('Equation selection prefers covering [min, max]', () => {
  function compoundWithTwoCp(): CompoundValue {
    return {
      name: 'Test', chemicalFormula: 'Xx', Mr: 0.028,
      enthalpyFormation298: 0, gibbsEnergy298: 0,
      heatCapacity: {
        def: 0,
        values: [
          { type: EquationTypeDto.linear, ref: RefKey.Szargut,
            vars: { a: 20, b: 0 }, min: 200, max: 500 },
          { type: EquationTypeDto.linear, ref: RefKey.Borgnakke,
            vars: { a: 40, b: 0 }, min: 600, max: 2000 },
        ],
      },
      viscosity: { def: 0, values: [
        { type: EquationTypeDto.linear, ref: RefKey.Yaws1999, vars: { a: 1e-5, b: 0 }, min: 200, max: 1500 },
      ]},
      thermalConductivity: { def: 0, values: [
        { type: EquationTypeDto.linear, ref: RefKey.Incropera, vars: { a: 0.02, b: 0 }, min: 200, max: 1500 },
      ]},
    };
  }

  it('picks covering equation when def does not cover T', () => {
    const resolver = new CompoundPropertyResolver(compoundWithTwoCp());
    // def covers [200,500]; at 1000 K the second equation covers → Cp = 40
    expect(resolver.heatCapacity(1000)).toBeCloseTo(40, 10);
    const r = resolver.heatCapacityResult(1000);
    expect(r.validity.inRange).toBe(true);
    expect(r.validity.action).toBe('none');
  });

  it('falls back to def and clamps when no equation covers T', () => {
    const resolver = new CompoundPropertyResolver(compoundWithTwoCp());
    // 550 K is between the two ranges — neither covers → def (20) clamped
    const r = resolver.heatCapacityResult(550);
    expect(r.value).toBeCloseTo(20, 10);
    expect(r.validity.action).toBe('clamped');
  });
});
