import { nasa9Species } from '../../../common/thermal/utils/nasa';
import { Nasa9EquationMethod } from '../../../common/thermal/utils/equation-methods';
import { Nasa9Range } from '../../../common/thermal/type/nasa9-range';
import { MIX_THERMAL_CONSTANTS } from '../constants/mix-thermal.constants';

type PhaseSegment = { range: Nasa9Range; molarMass_gmol: number };

const nasa9 = new Nasa9EquationMethod();
const segments = new Map<string, PhaseSegment[]>();

function phaseSegments(phase: string): PhaseSegment[] | undefined {
  const keys = MIX_THERMAL_CONSTANTS.phaseNasa9Species[phase];
  if (!keys) return undefined;
  let cached = segments.get(phase);
  if (!cached) {
    cached = keys.flatMap((key) => {
      const species = nasa9Species(key);
      return species.nasa9.ranges.map((range) => ({ range, molarMass_gmol: species.MW as number }));
    });
    segments.set(phase, cached);
  }
  return cached;
}

/**
 * Specific heat of a condensed phase [J/(kg·K)] from NASA-9, or undefined when the
 * phase has no NASA-9 species. T is clamped to the tabulated solid range
 * (polymorph transitions follow the species order of `phaseNasa9Species`).
 */
export function phaseSpecificHeat(phase: string, T_K: number): number | undefined {
  const list = phaseSegments(phase);
  if (!list) return undefined;
  const T = Math.min(Math.max(T_K, list[0].range.Tmin), list[list.length - 1].range.Tmax);
  const segment = list.find(({ range }) => T <= range.Tmax) ?? list[list.length - 1];
  const cp_JmolK = nasa9.calculate(T, { ranges: [segment.range] }, segment.range.Tmin, segment.range.Tmax);
  return (cp_JmolK / segment.molarMass_gmol) * 1000;
}
