import { MaterialEntry } from './interfaces/material.interface';
import { MATERIAL_MINERALOGY } from './material-mineralogy.data';
import { OXIDE_MATERIALS } from './materials/materials-oxide.data';
import { GLASS_MATERIALS } from './materials/materials-glass.data';
import { CARBIDE_NITRIDE_MATERIALS } from './materials/materials-carbide-nitride.data';
import { SILICATE_MATERIALS } from './materials/materials-silicate.data';
import { CLAY_MATERIALS } from './materials/materials-clay.data';
import { BINDER_MATERIALS } from './materials/materials-binder.data';
import { EXTENDED_MATERIAL_LIBRARY } from './materials/extended-materials.data';

/**
 * Complete material library — all group files combined.
 * Prefer importing group datasets directly when a subset is needed.
 * `MATERIAL_MINERALOGY` fills missing XRD tables; inline `mineralogy` on an entry wins.
 */
export const ALL_MATERIALS: MaterialEntry[] = [
  ...OXIDE_MATERIALS,
  ...GLASS_MATERIALS,
  ...CARBIDE_NITRIDE_MATERIALS,
  ...SILICATE_MATERIALS,
  ...CLAY_MATERIALS,
  ...BINDER_MATERIALS,
  ...EXTENDED_MATERIAL_LIBRARY,
].map(entry => ({
  ...entry,
  mineralogy: entry.mineralogy ?? MATERIAL_MINERALOGY[entry.materialId],
}));
