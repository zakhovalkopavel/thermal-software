import { BadRequestException } from '@nestjs/common';
import { CompoundValue } from '../../../common/thermal/types/compound-value.type';
import { CompoundLiquidValue } from '../../../common/thermal/utils/compound-data';
import { KnownFluids } from './known-fluids';

/**
 * Shared liquid-fluid identity → `CompoundValue` for transport / HTC.
 * Stateless — no DI.
 */
export class LiquidFluidResolve {
  /**
   * Build liquid transport compound from `compoundId` or water/H2O alias.
   * Throws `BadRequestException` on invalid liquid identity or missing data.
   */
  static compound(fluid?: string, compoundId?: string): { compound: CompoundValue; label: string } {
    if (fluid === 'gas_mix') {
      throw new BadRequestException('Liquid phase does not support gas_mix');
    }
    if (compoundId && fluid && fluid !== 'gas_mix') {
      throw new BadRequestException('Provide either fluid or compoundId, not both');
    }
    const catalogueId = KnownFluids.liquidCatalogueId(fluid, compoundId);
    if (!catalogueId) {
      throw new BadRequestException(
        'Liquid phase requires compoundId (catalogue id with liquid μ, λ, ρ, Cp) '
        + 'or fluid water/H2O',
      );
    }
    try {
      return { compound: CompoundLiquidValue.forTransport(catalogueId), label: catalogueId };
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }

  /** True when composition was supplied (unsupported for liquid). */
  static hasComposition(composition?: Record<string, number>): boolean {
    return Boolean(composition && Object.keys(composition).length > 0);
  }
}
