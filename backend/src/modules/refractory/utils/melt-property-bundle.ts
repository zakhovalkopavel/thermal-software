import type { GlassViscosityResult } from '../types/glass-viscosity-result.type';
import type { MeltPropertyBundle } from '../types/melt-property-bundle.type';
import type { SlagViscosityResult } from '../types/slag-viscosity-result.type';
import { GlassPointsAdapter } from './glass-points-adapter';
import { MeltViscosityAdapter } from './melt-viscosity-adapter';

/** Splits a glass/slag viscosity service result into API viscosity + glass points. */
export class MeltPropertyBundleAdapter {
  static adapt(result: GlassViscosityResult | SlagViscosityResult): MeltPropertyBundle {
    return {
      viscosity: MeltViscosityAdapter.adapt(result),
      glassPoints: GlassPointsAdapter.adapt(result),
    };
  }
}
