import type { CompleteMixFraction } from './complete-mix-fraction.type';
import type { PsdResult } from './psd-result.type';

export type PsdChartsProps = {
  fractions: CompleteMixFraction[];
  labels: string[];
  andreasen?: PsdResult;
  funkDinger?: PsdResult;
};
