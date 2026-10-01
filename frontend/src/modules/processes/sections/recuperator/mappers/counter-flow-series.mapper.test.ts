import { describe, expect, it } from 'vitest';
import type { RecuperatorInput } from '../types/recuperator-input.type';
import type { RecuperatorResult } from '../types/recuperator-result.type';
import { toCounterFlowSeries } from './counter-flow-series.mapper';

const RESULT: RecuperatorResult = {
  recuperatorLength_m: 1.5,
  tAirEnd_K: 873,
  tSmokeEnd_K: 760,
  tSmokeStart_K: 1450,
  tFlame_K: 2150,
  maxFlameTemp_K: 2230,
  energyReturnedPercent: 28,
  airEnergyIncrease_W: 1400,
  smokeEnergyDecrease_W: 1450,
  smokeTotalEnergy_W: 5000,
  alphaAverage_Wm2K: 18,
  averageDeltaT_K: 370,
  sSmoke_m2: 0.9,
  sAir_m2: 1.1,
  dAir_m: 0.04,
  dSmoke_m: 0.04,
  wSmokeStart_ms: 2.1,
  wSmokeEnd_ms: 1.2,
  wAirStart_ms: 0.8,
  wAirEnd_ms: 1.1,
  mFuel_kgh: 0.36,
};

describe('recuperator › counter-flow-series', () => {
  it('draws smoke from x = 0 and air from x = L as straight segments', () => {
    expect(toCounterFlowSeries({ tAirStart_K: 573 } as RecuperatorInput, RESULT)).toEqual([
      { name: 'Smoke', unit: 'K', showMarkers: true, data: [[0, 1450], [1.5, 760]] },
      { name: 'Air', unit: 'K', showMarkers: true, data: [[0, 873], [1.5, 573]] },
    ]);
  });
});
