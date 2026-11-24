import type { CompactionScenario } from './compaction-scenario.type';
import type { PackingModel } from './packing-model.type';
import type { PsdMethod } from './psd-method.type';

export type BlendOptimizationInput = {
  fractions: Array<{
    materialId: string;
    dMin_mm: number;
    dMax_mm: number;
    massFraction: number;
    isFixed: boolean;
    /** 1000–4000 */
    density_kgm3: number;
  }>;
  options: {
    qValues: number[];
    methods: PsdMethod[];
    packingModels: PackingModel[];
    scenarios: CompactionScenario[];
    waterCementRatio?: number;
  };
};
