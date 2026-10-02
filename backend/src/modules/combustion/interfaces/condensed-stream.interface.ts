import { CondensedFuel } from './condensed-fuel.interface';

export interface CondensedStream {
  fuel:  CondensedFuel;
  m_kgs: number;
  T_K:   number;
}
