import { BadRequestException } from '@nestjs/common';
import { FuelPhase } from '../../enums/fuel-phase.enum';
import { FUEL_REGISTRY } from '../../data/fuels';
import { FuelId } from '../../enums/fuel-id.enum';
import { GasFlows } from '../../types';
import { resolveFuelGas } from './resolve-fuel-gas.util';

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
