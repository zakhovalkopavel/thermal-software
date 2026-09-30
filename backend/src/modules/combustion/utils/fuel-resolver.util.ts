import { BadRequestException } from '@nestjs/common';
import { Species } from '../../thermodynamics/enums/species.enum';
import { GAS_REGISTRY } from '../../../common/thermal/compound/gas/registry';
import { COMBUSTION } from '../constants/combustion.constants';
import { CondensedFuel, FuelPhase } from '../data/fuels/fuel.interface';
import { FUEL_REGISTRY } from '../data/fuels';
import { FuelId } from '../enums/fuel-id.enum';
import { CondensedFuelDto, FuelSummaryDto } from '../dto/condensed-fuel.dto';
import { GasFlows } from '../interfaces/combustion-streams.interface';
import { CombustionEnthalpyService } from '../services/combustion-enthalpy.service';
import {
  elementsOfCondensed, elementsOfGas, gasMassFlow, speciesMolarMass, stoichiometricO2,
} from './element-balance.util';

const COMPOSITION_SUM_TOL = 1e-3;

export function resolveCondensedFuel(
  fuelId: FuelId | undefined,
  custom: CondensedFuelDto | undefined,
  phase: FuelPhase.Solid | FuelPhase.Liquid = FuelPhase.Solid,
): CondensedFuel {
  if ((fuelId === undefined) === (custom === undefined)) {
    throw new BadRequestException('Specify exactly one of `fuelId` or `fuel`');
  }
  if (fuelId !== undefined) {
    const preset = FUEL_REGISTRY[fuelId];
    if (!preset || preset.phase === FuelPhase.Gas) throw new BadRequestException(`Fuel ${fuelId} is not a solid/liquid fuel`);
    return preset;
  }
  const c = custom!;
  const e = c.elementalComp;
  const sum = e.C + e.H + e.O + e.N + (e.S ?? 0) + e.ash + (e.moisture ?? 0);
  if (Math.abs(sum - 1) > COMPOSITION_SUM_TOL) {
    throw new BadRequestException(`Elemental composition must sum to 1 (got ${sum.toFixed(4)})`);
  }
  if (c.heatOfFormation_J_kg === undefined && c.lhv_J_kg === undefined) {
    throw new BadRequestException('Custom fuel needs `heatOfFormation_J_kg` or `lhv_J_kg`');
  }
  return {
    id:    'custom',
    name:  c.name ?? 'Custom fuel',
    phase,
    elementalComp: { ...e },
    heatOfFormation_J_kg: c.heatOfFormation_J_kg,
    lhv_J_kg:             c.lhv_J_kg,
    specificHeat_J_kgK:   c.specificHeat_J_kgK ?? COMBUSTION.FUEL_CAPACITY_J_KGK,
    porosity:          c.porosity,
    bulkDensity_kg_m3: c.bulkDensity_kg_m3,
    particleSize_m:    c.particleSize_m,
    activityFactor:    c.activityFactor,
    emissivity:        c.emissivity,
  };
}

export function resolveFuelFlow(mFuel_kgs: number | undefined, fPower_W: number | undefined, lhv_Jkg: number): number {
  if ((mFuel_kgs === undefined) === (fPower_W === undefined)) {
    throw new BadRequestException('Specify exactly one of `mFuel_kgs` or `fPower_W`');
  }
  if (mFuel_kgs !== undefined) return mFuel_kgs;
  if (lhv_Jkg <= 0) throw new BadRequestException('Fuel LHV must be positive to derive the flow from power');
  return fPower_W! / lhv_Jkg;
}

/** Gaseous fuel from a preset (`fuelId`) or custom mole fractions (`fuelGas`), normalised */
export function resolveGaseousFuel(
  fuelId: FuelId | undefined, raw: Record<string, number> | undefined,
): { id: string; name: string; y: GasFlows } {
  if ((fuelId === undefined) === (raw === undefined)) {
    throw new BadRequestException('Specify exactly one of `fuelId` or `fuelGas` for gaseous fuel');
  }
  if (fuelId !== undefined) {
    const preset = FUEL_REGISTRY[fuelId];
    if (!preset || preset.phase !== FuelPhase.Gas) throw new BadRequestException(`Fuel ${fuelId} is not a gaseous fuel`);
    return { id: preset.id, name: preset.name, y: resolveFuelGas(preset.moleFractions) };
  }
  return { id: 'custom-gas', name: 'Gaseous fuel', y: resolveFuelGas(raw) };
}

/** Validated, normalised gaseous fuel mole fractions */
export function resolveFuelGas(raw: Record<string, number> | undefined): GasFlows {
  if (!raw || Object.keys(raw).length === 0) throw new BadRequestException('`fuelGas` is required for gaseous fuel');
  let total = 0;
  for (const [sp, y] of Object.entries(raw)) {
    if (!GAS_REGISTRY[sp]) throw new BadRequestException(`Unknown fuel gas species: ${sp}`);
    if (!(y >= 0)) throw new BadRequestException(`Invalid mole fraction for ${sp}`);
    total += y;
  }
  if (total <= 0) throw new BadRequestException('Fuel gas mole fractions sum to zero');
  const out: GasFlows = {};
  for (const [sp, y] of Object.entries(raw)) if (y > 0) out[sp as Species] = y / total;
  return out;
}

/** Dry air [kg] carrying `o2_mols` of O2 */
export function dryAirMass(o2_mols: number, pO2: number): number {
  return o2_mols * (speciesMolarMass(Species.O2) + (1 - pO2) / pO2 * speciesMolarMass(Species.N2));
}

export function summarizeCondensedFuel(
  fuel: CondensedFuel, pO2: number, enthalpy: CombustionEnthalpyService,
): FuelSummaryDto {
  return {
    id:    fuel.id,
    name:  fuel.name,
    phase: fuel.phase,
    lhv_Jkg:             enthalpy.fuelLhv_Jkg(fuel),
    heatOfFormation_Jkg: enthalpy.fuelFormationEnthalpy_Jkg(fuel),
    stoichAir_kgkg:      dryAirMass(stoichiometricO2(elementsOfCondensed(fuel.elementalComp, 1)), pO2),
  };
}

/** Summary of a gaseous fuel given by normalised mole fractions */
export function summarizeGaseousFuel(
  id: string, name: string, y: GasFlows, pO2: number, enthalpy: CombustionEnthalpyService,
): FuelSummaryDto {
  const M_kgmol = gasMassFlow(y);
  return {
    id, name,
    phase: FuelPhase.Gas,
    lhv_Jkg:             enthalpy.gasFuelLhv_Jkg(y),
    heatOfFormation_Jkg: enthalpy.gasEnthalpy_W(y, COMBUSTION.T_REF_K) / M_kgmol,
    stoichAir_kgkg:      dryAirMass(stoichiometricO2(elementsOfGas(y).elements) / M_kgmol, pO2),
    moleFractions:       { ...y },
  };
}
