import { screen, waitFor } from '@testing-library/react';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { appRoutes } from '../../src/app/app-routes';
import { api } from '../../src/services/api/client';
import { collectRoutePaths } from '../setup/collect-route-paths';
import { createFixtureAdapter } from '../setup/fixture-adapter';
import { renderApp } from '../setup/render-app';

const UNKNOWN_PATH = '/this-route-does-not-exist';
const ROUTE_PATHS = [...collectRoutePaths(appRoutes), UNKNOWN_PATH];
const SETTLE_TIMEOUT_MS = 20_000;
const API_URL = process.env.CONTRACT_API_URL ?? 'http://backend:4000/api/v1';

const fixtures = createFixtureAdapter({ record: process.env.RECORD_FIXTURES === '1', apiUrl: API_URL });
const originalAdapter = api.defaults.adapter;

beforeAll(() => {
  api.defaults.adapter = fixtures.adapter;
});

afterAll(() => {
  api.defaults.adapter = originalAdapter;
});

describe('smoke › routes', () => {
  it.each(ROUTE_PATHS)('smoke › %s renders without errors', async (path) => {
    const { queryClient } = renderApp(path);

    expect((await screen.findAllByRole('heading')).length).toBeGreaterThan(0);
    await waitFor(() => expect(queryClient.isFetching()).toBe(0), { timeout: SETTLE_TIMEOUT_MS });

    expect(screen.queryByText(/Unexpected Application Error/i)).toBeNull();
    const missing = fixtures.takeMissing();
    if (missing.length > 0) {
      throw new Error(`no fixture for:\n  ${missing.join('\n  ')}\nRun: npm run fixtures:record`);
    }
  });
});
