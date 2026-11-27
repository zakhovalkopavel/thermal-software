import { describe, expect, it } from 'vitest';
import { PHASE_EQUILIBRIUM_RESULT } from '../../../../../../tests/fixtures/inputs/phase-equilibrium-result';
import { PHASE_EQUILIBRIUM_UI } from '../constants/phase-equilibrium-ui.constants';
import { toPhaseCompositionBars } from './phase-composition-bars.mapper';

describe('mineral-compositions › phase-composition-bars', () => {
  it('lists liquid and every crystal phase at temperature; no glass bar when there is no glass', () => {
    expect(toPhaseCompositionBars(PHASE_EQUILIBRIUM_RESULT)).toEqual({
      categories: ['Liquid (matrix)', 'Corundum', 'Mullite'],
      series: [{ name: 'Amount', data: [22, 50, 28] }],
    });
  });

  it('adds an unreacted-glass-cores bar when amorphous cores remain', () => {
    const result = {
      ...PHASE_EQUILIBRIUM_RESULT,
      atTemperature: { ...PHASE_EQUILIBRIUM_RESULT.atTemperature, glass: { percent: 3, mass: 3, composition: {} } },
    };
    expect(toPhaseCompositionBars(result).categories).toEqual([
      'Liquid (matrix)',
      PHASE_EQUILIBRIUM_UI.unreactedGlassBarLabel,
      'Corundum',
      'Mullite',
    ]);
  });
});
