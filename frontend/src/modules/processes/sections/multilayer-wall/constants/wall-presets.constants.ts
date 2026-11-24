import type { WallPreset } from '../types/wall-preset.type';

const SMOKE = { N2: 0.72, O2: 0.02, CO2: 0.13, CO: 0, H2O: 0.13, H2: 0 };

/** The Swagger examples of `POST /thermal-exchange/multilayer-wall`. */
export const WALL_PRESETS: WallPreset[] = [
  {
    id: 'chamotte-flat',
    label: 'Flat wall: 200 mm chamotte + 100 mm lightweight',
    draft: {
      geometry: 'flat',
      values: { a_m: 0.5, b_m: 2, w_ms: 4, mPerSecond_kgs: 0.5, tFlame_K: 1473, tAmbient_K: 293, innerEmissivity: 0.85, numberOfSteps: null },
      composition: SMOKE,
    },
    layers: [
      { material: 'chamotte_solid', thicknessMm: 200, kind: 'refractory' },
      { material: 'chamotte_600', thicknessMm: 100, kind: 'refractory' },
    ],
  },
  {
    id: 'steel-cylinder',
    label: 'Cylinder: mild steel shell + basalt fibre',
    draft: {
      geometry: 'cylinder',
      values: { a_m: 0.6, b_m: 3, w_ms: 3, mPerSecond_kgs: 0.3, tFlame_K: 1200, tAmbient_K: 293, innerEmissivity: 0.6, numberOfSteps: null },
      composition: SMOKE,
    },
    layers: [
      { material: 'mild_steel', thicknessMm: 10, kind: 'metal' },
      { material: 'basalt_fiber_mat', thicknessMm: 80, kind: 'refractory' },
    ],
  },
];
