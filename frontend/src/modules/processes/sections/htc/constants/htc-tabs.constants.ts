import type { HtcTabKey } from '../types/htc-tab-key.type';

export const HTC_TABS: ReadonlyArray<{ value: HtcTabKey; label: string }> = [
  { value: 'htc', label: 'Heat-transfer coefficient' },
  { value: 'body', label: 'Body geometry' },
];
