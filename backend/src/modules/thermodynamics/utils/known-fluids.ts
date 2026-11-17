import { FLUID_REGISTRY } from '../../../common/thermal/compound/gas';
import { KnownFluid } from '../types/known-fluid.type';

/** API mode for an explicit mole-fraction mixture (not a registry compound). */
const GAS_MIX = 'gas_mix';

/**
 * Named-fluid helpers backed by `FLUID_REGISTRY` (real compounds).
 * Stateless — no DI.
 */
export class KnownFluids {
  /** Registry keys plus `gas_mix` for composition mode. */
  static allowedNames(): string[] {
    return [...Object.keys(FLUID_REGISTRY), GAS_MIX];
  }

  /** Swagger / docs list of accepted `fluid` values. */
  static description(): string {
    return KnownFluids.allowedNames().map(name => `"${name}"`).join(', ');
  }

  /** True if `fluid` is a registry key or `gas_mix`. */
  static isAllowed(fluid: string): boolean {
    return fluid === GAS_MIX || Object.prototype.hasOwnProperty.call(FLUID_REGISTRY, fluid);
  }

  /**
   * Map legacy alias `water` → registry key `H2O`. Other values unchanged.
   */
  static normalize(fluid: KnownFluid): KnownFluid;
  static normalize(fluid: KnownFluid | undefined): KnownFluid | undefined;
  static normalize(fluid: KnownFluid | undefined): KnownFluid | undefined {
    if (fluid === 'water') return 'H2O';
    return fluid;
  }
}
