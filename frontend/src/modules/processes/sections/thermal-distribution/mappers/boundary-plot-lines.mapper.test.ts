import { describe, expect, it } from 'vitest';
import { THERMAL_DEFAULTS } from '../constants/thermal-defaults.constants';
import { toBoundaryPlotLines } from './boundary-plot-lines.mapper';
import { toThermalRequest } from './thermal-request.mapper';

describe('thermal-distribution › boundary-plot-lines', () => {
  it('marks the medium and initial temperatures', () => {
    expect(toBoundaryPlotLines(toThermalRequest(THERMAL_DEFAULTS))).toEqual([
      { value: 20, label: 'Medium T_c = 20 °C', dashStyle: 'Dash' },
      { value: 850, label: 'Initial T₀ = 850 °C', dashStyle: 'ShortDot' },
    ]);
  });
});
