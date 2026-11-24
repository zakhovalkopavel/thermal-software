import type { XYSeries } from '@/shared/ui/charts';
import type { BedLayerResult } from '../../../types/bed-layer-result.type';
import { COMBUSTION_UI } from '../constants/combustion-ui.constants';

const PERCENT = 100;

/** Temperatures on axis 0 [K]; O2 / CO2 / CO on axis 1 [mol %]. */
export function toBedProfileSeries(layers: BedLayerResult[]): XYSeries[] {
  return [
    { name: 'Gas T', unit: 'K', emphasis: true, data: layers.map((layer) => [layer.z_m, layer.tGas_K]) },
    { name: 'Solid T', unit: 'K', data: layers.map((layer) => [layer.z_m, layer.tSolid_K]) },
    ...COMBUSTION_UI.bedProfileSpecies.map(
      (species): XYSeries => ({
        name: species,
        unit: '%',
        yAxis: 1,
        dashStyle: 'Dash',
        data: layers.map((layer) => [layer.z_m, (layer.moleFractions[species] ?? 0) * PERCENT]),
      }),
    ),
  ];
}
