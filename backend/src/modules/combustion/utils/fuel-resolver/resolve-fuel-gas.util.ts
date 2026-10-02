import { BadRequestException } from '@nestjs/common';
import { Species } from '../../../thermodynamics/enums';
import { GAS_REGISTRY } from '../../../../common/thermal/compound/gas';
import { GasFlows } from '../../types';

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
