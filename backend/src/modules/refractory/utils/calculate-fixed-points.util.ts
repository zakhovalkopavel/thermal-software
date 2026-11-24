/**
 * Build ASTM C965-96 fixed-point temperatures from any η(T) inverse.
 *
 * The log₁₀(η) targets are universal for glasses; only the temperature
 * solver changes (VTF, Arrhenius, …).
 */
import { ASTM_FIXED_POINT_LOG_ETA } from '../constants/astm-fixed-point-log-eta.constants';
import type { FixedPoints } from '../types';

/**
 * Evaluate all fixed points and spans via a temperature-at-log-η callback.
 *
 * @param temperatureAtLogEta  Inverse model: log₁₀(η / Pa·s) → T [°C]
 */
export function calculateFixedPoints(
  temperatureAtLogEta: (logEtaPaS: number) => number,
): FixedPoints {
  const L = ASTM_FIXED_POINT_LOG_ETA;
  const fp: FixedPoints = {
    meltingPoint_C:   temperatureAtLogEta(L.melting),
    workingPoint_C:   temperatureAtLogEta(L.working),
    flowPoint_C:      temperatureAtLogEta(L.flow),
    softeningPoint_C: temperatureAtLogEta(L.softening),
    annealingPoint_C: temperatureAtLogEta(L.annealing),
    strainPoint_C:    temperatureAtLogEta(L.strain),
  };

  fp.spans = {
    meltingToStrain_C:      fp.meltingPoint_C   - fp.strainPoint_C,
    workingToSoftening_C:   fp.workingPoint_C   - fp.softeningPoint_C,
    softeningToAnnealing_C: fp.softeningPoint_C - fp.annealingPoint_C,
    annealingToStrain_C:    fp.annealingPoint_C - fp.strainPoint_C,
  };

  return fp;
}
