/**
 * Material Library Index
 *
 * Central export point for all material data
 * This file consolidates materials from all group-specific files
 *
 * DEPRECATES: material-library.data.ts (old monolithic file)
 */

import { MaterialEntry } from './interfaces/material.interface';

// Import from materials/ subfolder
import { OXIDE_MATERIALS } from './materials/materials-oxide.data';
import { GLASS_MATERIALS } from './materials/materials-glass.data';
import { CARBIDE_NITRIDE_MATERIALS } from './materials/materials-carbide-nitride.data';
import { SILICATE_MATERIALS } from './materials/materials-silicate.data';
import { CLAY_MATERIALS } from './materials/materials-clay.data';
import { BINDER_MATERIALS } from './materials/materials-binder.data';
import { EXTENDED_MATERIAL_LIBRARY } from './materials/extended-materials.data';

/**
 * Complete Material Library
 * All materials from all group files combined
 */
export const ALL_MATERIALS: MaterialEntry[] = [
  ...OXIDE_MATERIALS,          // 22 oxide materials
  ...GLASS_MATERIALS,           // 21 glass materials (+2 brown & green bottle glass)
  ...CARBIDE_NITRIDE_MATERIALS, // 9 carbide & nitride materials
  ...SILICATE_MATERIALS,        // 12 silicate materials
  ...CLAY_MATERIALS,            // 11 clay materials
  ...BINDER_MATERIALS,          // 4 binder materials
  ...EXTENDED_MATERIAL_LIBRARY, // 41 specialty materials
];

/**
 * Export individual collections for specific use cases
 */
export {
  OXIDE_MATERIALS,
  GLASS_MATERIALS,
  CARBIDE_NITRIDE_MATERIALS,
  SILICATE_MATERIALS,
  CLAY_MATERIALS,
  BINDER_MATERIALS,
  EXTENDED_MATERIAL_LIBRARY,
};

/**
 * Material counts by group
 */
export const MATERIAL_COUNTS = {
  oxides: OXIDE_MATERIALS.length,
  glasses: GLASS_MATERIALS.length,
  carbides_nitrides: CARBIDE_NITRIDE_MATERIALS.length,
  silicates: SILICATE_MATERIALS.length,
  clays: CLAY_MATERIALS.length, // 10 clays (4 refractory + 6 pottery)
  binders: BINDER_MATERIALS.length,
  extended: EXTENDED_MATERIAL_LIBRARY.length,
  total: ALL_MATERIALS.length,
};

/**
 * Helper function to get material by ID
 */
export function getMaterialById(materialId: string): MaterialEntry | undefined {
  return ALL_MATERIALS.find(m => m.materialId === materialId);
}

/**
 * Helper function to get materials by group
 */
export function getMaterialsByGroup(group: string): MaterialEntry[] {
  return ALL_MATERIALS.filter(m => m.materialGroup.includes(group));
}

/**
 * Helper function to get materials by type
 */
export function getMaterialsByType(type: MaterialEntry['type']): MaterialEntry[] {
  return ALL_MATERIALS.filter(m => m.type === type);
}

/**
 * Helper function to get materials by order number range
 */
export function getMaterialsByOrderRange(min: number, max: number): MaterialEntry[] {
  return ALL_MATERIALS.filter(m => m.orderNumber >= min && m.orderNumber <= max);
}

