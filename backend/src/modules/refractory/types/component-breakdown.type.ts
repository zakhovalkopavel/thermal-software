import type { ComponentEffect } from './component-effect.type';

/** Component breakdown and effects. */
export type ComponentBreakdown = {
  networkFormers: ComponentEffect[];
  networkModifiers: ComponentEffect[];
  fluorides: ComponentEffect[];
  chlorides: ComponentEffect[];
};
