import type { XYSeries } from '../../../../../components/charts';
import type { ShrinkageResult } from '../types/shrinkage-result.type';
import type { ShrinkageStage } from '../types/shrinkage-stage.type';

const toPoints = (stage: ShrinkageStage): [number, number][] =>
  stage.temperatures_C.map((temperature, index) => [temperature, stage.shrinkage_linear_percent[index]]);

/** Drying point first, then sintering per firing temperature and the cumulative total. */
export function toShrinkageSeries(result: ShrinkageResult): XYSeries[] {
  const drying = toPoints(result.drying);
  return [
    { name: 'Total (drying + sintering)', emphasis: true, showMarkers: true, data: [...drying, ...toPoints(result.total)] },
    { name: 'Sintering only', dashStyle: 'Dash', showMarkers: true, data: result.firing.flatMap(toPoints) },
  ];
}
