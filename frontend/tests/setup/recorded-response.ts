import type { FixtureFile } from './fixture-file.type';
import { fixtureKey } from './fixture-key';

const RECORDED = import.meta.glob<FixtureFile>('../fixtures/responses/*.json', { eager: true, import: 'default' });

/** Data of a recorded backend response, by request key, e.g. `recordedResponse<MetalSummary[]>('GET /metals/list')`. */
export function recordedResponse<T>(key: string): T {
  const fixture = Object.values(RECORDED).find(
    (file) => fixtureKey(file.request.method, file.request.path, file.request.params) === key,
  );
  if (!fixture) throw new Error(`no recorded response for ${key}; run npm run fixtures:record`);
  return fixture.data as T;
}
