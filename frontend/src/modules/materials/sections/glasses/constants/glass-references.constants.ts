/** Library glasses matching the backend glass-viscosity test compositions; compositions come from the library. */
export const GLASS_REFERENCES = {
  ids: ['soda_lime_glass', 'borosilicate_glass', 'lead_glass', 'quartz_glass'],
  defaultSelection: ['soda_lime_glass', 'borosilicate_glass', 'lead_glass'],
  min: 1,
  max: 3,
} as const;
