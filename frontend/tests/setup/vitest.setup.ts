import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { installBrowserPolyfills } from './browser-polyfills';
import { resetChartStub } from './chart-stub-store';

vi.mock('highcharts-react-official', async () => import('./highcharts-react.mock'));

installBrowserPolyfills();

let consoleErrors: string[] = [];

beforeEach(() => {
  consoleErrors = [];
  resetChartStub();
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    consoleErrors.push(args.map(String).join(' '));
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  if (consoleErrors.length > 0) {
    throw new Error(`console.error was called during the test:\n${consoleErrors.join('\n---\n')}`);
  }
});
