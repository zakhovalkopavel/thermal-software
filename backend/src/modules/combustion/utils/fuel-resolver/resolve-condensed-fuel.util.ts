import { BadRequestException } from '@nestjs/common';
import { COMBUSTION } from '../../constants';
import { CondensedFuel } from '../../interfaces';
import { FuelPhase } from '../../enums/fuel-phase.enum';
import { FUEL_REGISTRY } from '../../data/fuels';
import { FuelId } from '../../enums/fuel-id.enum';
import { CondensedFuelDto } from '../../dto/common';

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
  if (Math.abs(sum - 1) > COMBUSTION.COMPOSITION_SUM_TOL) {
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
