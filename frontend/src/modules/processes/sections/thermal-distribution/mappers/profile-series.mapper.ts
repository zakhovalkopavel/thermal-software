import type { XYSeries } from '@/shared/ui/charts';
import type { TimedProfile } from '../types/timed-profile.type';

export function toProfileSeries(depths: number[], profiles: TimedProfile[]): XYSeries[] {
  return profiles.flatMap(({ tau, temperatures }): XYSeries[] =>
    temperatures ? [{ name: `τ = ${tau} s`, unit: '°C', data: depths.map((depth, index): [number, number] => [depth, temperatures[index]]) }] : [],
  );
}
