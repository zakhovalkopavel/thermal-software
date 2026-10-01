import { chownSync, statSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { AxiosError, AxiosHeaders, type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import type { FixtureFile } from './fixture-file.type';
import { fixtureFileName } from './fixture-file-name';
import { fixtureKey } from './fixture-key';

const FIXTURE_DIR = 'tests/fixtures/responses';
const RECORDED = import.meta.glob<FixtureFile>('../fixtures/responses/*.json', { eager: true, import: 'default' });

type FixtureAdapterOptions = { record: boolean; apiUrl: string };

function parseBody(data: unknown): unknown {
  if (typeof data !== 'string') return data;
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
}

function toResponse(config: InternalAxiosRequestConfig, fixture: FixtureFile): AxiosResponse {
  const response: AxiosResponse = {
    data: fixture.data,
    status: fixture.status,
    statusText: String(fixture.status),
    headers: new AxiosHeaders(),
    config,
  };
  if (fixture.status >= 400) {
    throw new AxiosError(`HTTP ${fixture.status}`, AxiosError.ERR_BAD_RESPONSE, config, null, response);
  }
  return response;
}

async function fetchFromBackend(apiUrl: string, key: string, request: FixtureFile['request']): Promise<FixtureFile> {
  const query = key.includes('?') ? key.slice(key.indexOf('?')) : '';
  const response = await fetch(`${apiUrl}${request.path}${query}`, {
    method: request.method,
    headers: { 'Content-Type': 'application/json' },
    body: request.body === undefined ? undefined : JSON.stringify(request.body),
  });
  const text = await response.text();
  return { request, status: response.status, data: text ? JSON.parse(text) : null };
}

/**
 * Answers axios requests from `tests/fixtures/responses`. In record mode a missing fixture is fetched from the
 * backend and written; otherwise it is collected in `missing` and the request fails.
 */
export function createFixtureAdapter({ record, apiUrl }: FixtureAdapterOptions) {
  const byKey = new Map(Object.values(RECORDED).map((fixture) => [fixtureKey(fixture.request.method, fixture.request.path, fixture.request.params), fixture]));
  const missing: string[] = [];

  const adapter: AxiosAdapter = async (config) => {
    const method = (config.method ?? 'get').toUpperCase();
    const path = config.url ?? '';
    const params = config.params as Record<string, unknown> | undefined;
    const key = fixtureKey(method, path, params);
    const known = byKey.get(key);
    if (known) return toResponse(config, known);

    if (!record) {
      missing.push(key);
      throw new AxiosError(`no fixture for ${key}`, AxiosError.ERR_NETWORK, config);
    }

    const fixture = await fetchFromBackend(apiUrl, key, { method, path, params, body: parseBody(config.data) });
    const file = resolve(FIXTURE_DIR, fixtureFileName(key));
    writeFileSync(file, `${JSON.stringify(fixture, null, 2)}\n`);
    // The container runs as root; keep recorded files owned by the host user who owns the folder.
    const owner = statSync(FIXTURE_DIR);
    chownSync(file, owner.uid, owner.gid);
    byKey.set(key, fixture);
    return toResponse(config, fixture);
  };

  return {
    adapter,
    takeMissing(): string[] {
      return missing.splice(0, missing.length);
    },
  };
}
