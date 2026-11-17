import { CompoundValue } from '../../../common/thermal/interfaces/compound-value.interface';
import {
  EquationValidity,
  EvaluationResult,
  MixtureValidity,
} from '../../../common/thermal/interfaces/equation-validity.interface';
import { CompoundPropertyResolver } from '../../../common/thermal/utils/compound-properties/compound-property-resolver';
import { evaluateEquation } from '../../../common/thermal/utils/equation-validity.util';
import { EquationTypeDto } from '../../../common/thermal/dto/equation-type.dto';
import { EquationValue } from '../../../common/thermal/interfaces/equation-value.interface';
import { RefKey } from '../../../common/thermal/enum/ref-key.enum';
import { PHYSICAL_CONSTANTS } from '../../../common/thermal/constants/physical.constants';
import { STANDARD_CONDITIONS } from '../../../common/thermal/constants/standard-conditions.constants';
import { Species } from '../enums/species.enum';
import { GasPropertiesService } from '../services/gas-properties.service';
import { TransportService } from '../services/transport.service';

/**
 * Thermophysical props for one compound.
 *
 * Prefer equations on the compound. When a property bucket is empty and the
 * compound has `composition`, evaluate that property as a mole-fraction mixture.
 */
export interface CompoundFluidProps {
  M: number;
  Cp_J_molK: number;
  Cp_J_kgK: number;
  mu_Pa_s: number;
  lambda: number;
  rho_kg_m3: number;
  nu_m2s: number;
  validity: EquationValidity;
  mixtureValidity?: MixtureValidity;
  cpValidity: EquationValidity;
  muValidity: EquationValidity;
  lambdaValidity: EquationValidity;
}

export function resolveCompoundFluidProps(
  gasProps: GasPropertiesService,
  transport: TransportService,
  compound: CompoundValue,
  T_K: number,
  P_Pa: number = STANDARD_CONDITIONS.PRESSURE_PA,
): CompoundFluidProps {
  const M = compound.Mr;
  const mole = moleComposition(compound);

  const cpR = heatCapacityOf(compound, gasProps, mole, T_K);
  const muR = viscosityOf(compound, transport, mole, T_K);
  const lamR = conductivityOf(compound, gasProps, transport, mole, T_K, cpR.value);

  const rho_kg_m3 = gasProps.density(M, T_K, P_Pa);
  const mixtureValidity = muR.mixtureValidity ?? lamR.mixtureValidity;

  return {
    M,
    Cp_J_molK: cpR.value,
    Cp_J_kgK: cpR.value / M,
    mu_Pa_s: muR.value,
    lambda: lamR.value,
    rho_kg_m3,
    nu_m2s: muR.value / rho_kg_m3,
    validity: pickWorstValidity([cpR.validity, muR.validity, lamR.validity], T_K),
    mixtureValidity,
    cpValidity: cpR.validity,
    muValidity: muR.validity,
    lambdaValidity: lamR.validity,
  };
}

function moleComposition(
  compound: CompoundValue,
): Partial<Record<Species, number>> | undefined {
  if (!compound.composition || Object.keys(compound.composition).length === 0) {
    return undefined;
  }
  return compound.composition as Partial<Record<Species, number>>;
}

function heatCapacityOf(
  compound: CompoundValue,
  gasProps: GasPropertiesService,
  mole: Partial<Record<Species, number>> | undefined,
  T_K: number,
): EvaluationResult {
  const hasOwn =
    (compound.heatCapacity?.values.length ?? 0) > 0
    || !!compound.nasa7Key
    || !!compound.nasa9Key;
  if (hasOwn) {
    return new CompoundPropertyResolver(compound).heatCapacityResult(T_K);
  }
  if (mole) return gasProps.cpMixtureResult(mole, T_K);
  throw new Error(`No heat-capacity data for ${compound.name}`);
}

function viscosityOf(
  compound: CompoundValue,
  transport: TransportService,
  mole: Partial<Record<Species, number>> | undefined,
  T_K: number,
): EvaluationResult & { mixtureValidity?: MixtureValidity } {
  if (compound.viscosity.values.length > 0) {
    const sutherlandRow = compound.viscosity.values.find(v => v.type === EquationTypeDto.sutherland);
    if (sutherlandRow) return evaluateEquation(sutherlandRow, T_K);

    const p = compound.sutherlandParams;
    if (p) {
      const entry: EquationValue = {
        type: EquationTypeDto.sutherland,
        ref: RefKey.White3,
        vars: { y0: p.mu0, T0: p.T0, S: p.S },
        min: p.min,
        max: p.max,
      };
      return evaluateEquation(entry, T_K);
    }

    return new CompoundPropertyResolver(compound).viscosityResult(T_K);
  }
  if (mole) {
    const r = transport.viscosityMixResult(mole, T_K);
    return { value: r.value, validity: r.validity, mixtureValidity: r.mixtureValidity };
  }
  throw new Error(`No viscosity data for ${compound.name}`);
}

function conductivityOf(
  compound: CompoundValue,
  gasProps: GasPropertiesService,
  transport: TransportService,
  mole: Partial<Record<Species, number>> | undefined,
  T_K: number,
  Cp_J_molK: number,
): EvaluationResult & { mixtureValidity?: MixtureValidity } {
  if (compound.thermalConductivity.values.length > 0) {
    return new CompoundPropertyResolver(compound).thermalConductivityResult(T_K);
  }
  if (mole) {
    const cpBySp = Object.fromEntries(
      (Object.keys(mole) as Species[]).map(sp => [sp, gasProps.cpSpecies(sp, T_K)]),
    ) as Partial<Record<Species, number>>;
    const r = transport.thermalConductivityMixResult(mole, T_K, cpBySp);
    return { value: r.value, validity: r.validity, mixtureValidity: r.mixtureValidity };
  }

  // Pure compound with no stored k(T): Eucken λ = (Cp + 1.25·R)·μ / M
  const muR = viscosityOf(compound, transport, undefined, T_K);
  const value =
    (Cp_J_molK + 1.25 * PHYSICAL_CONSTANTS.GAS_CONSTANT_J_MOLK) * muR.value / compound.Mr;
  return {
    value,
    validity: {
      ...muR.validity,
      message: muR.validity.message
        ? `Eucken λ from μ: ${muR.validity.message}`
        : 'Eucken λ from μ (no stored k(T) correlation).',
    },
  };
}

function pickWorstValidity(parts: EquationValidity[], T_K: number): EquationValidity {
  const anyExtrapolated = parts.some(v => v.action === 'extrapolated');
  const anyClamped = parts.some(v => v.action === 'clamped');
  const anyUnknown = parts.some(v => v.rangeUnknown);
  const allInRange = parts.every(v => v.inRange && !v.rangeUnknown);
  return {
    requestedT: T_K,
    effectiveT: T_K,
    min: null,
    max: null,
    inRange: allInRange,
    rangeUnknown: anyUnknown,
    action: anyExtrapolated ? 'extrapolated' : anyClamped ? 'clamped' : 'none',
    message: allInRange
      ? undefined
      : 'One or more property correlations are outside range or unknown.',
  };
}
