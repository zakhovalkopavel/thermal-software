import type { PlotBand } from '../../../../../components/charts';
import type { WallCalculation } from '../types/wall-calculation.type';

export function toWallBands({ input, layerNames }: WallCalculation): PlotBand[] {
  let from = 0;
  return input.layers.map((layer, index) => {
    const band = { from, to: from + layer.thicknessMm, label: layerNames[index] ?? layer.material };
    from = band.to;
    return band;
  });
}
