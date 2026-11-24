import type { GlassCurve } from '../../../src/modules/materials/sections/glasses/types/glass-curve.type';

export const SODA_LIME_CURVE: GlassCurve = {
  key: 'user',
  name: 'My glass',
  isUser: true,
  swapped: false,
  profile: {
    model: 'VFT viscosity (Fluegel 2007)',
    points: [
      { temperature_C: 800, logViscosity: 6.2, viscosity_Pas: 1584893 },
      { temperature_C: 1200, logViscosity: 3.1, viscosity_Pas: 1259 },
    ],
    fixedPoints: {
      meltingPoint_C: 1455,
      workingPoint_C: 1005,
      softeningPoint_C: 724,
      annealingPoint_C: 546,
      strainPoint_C: 506,
      spans: { meltingToStrain_C: 949, workingToSoftening_C: 281, softeningToAnnealing_C: 178, annealingToStrain_C: 40 },
    },
    validation: { systemDetected: 'soda-lime-silica', confidenceLevel: 'high', warnings: [], extrapolationRisk: 'low' },
  },
};
