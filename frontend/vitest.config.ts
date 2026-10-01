import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

const SETUP_FILES = ['tests/setup/vitest.setup.ts'];

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      reporters: ['default', 'junit', 'json'],
      outputFile: { junit: 'test-results/junit.xml', json: 'test-results/results.json' },
      projects: [
        {
          extends: true,
          test: {
            name: 'unit',
            environment: 'jsdom',
            include: ['src/**/*.test.ts', 'tests/unit/**/*.test.ts'],
            setupFiles: SETUP_FILES,
          },
        },
        {
          extends: true,
          test: { name: 'component', environment: 'jsdom', include: ['src/**/*.test.tsx'], setupFiles: SETUP_FILES },
        },
        {
          extends: true,
          test: {
            name: 'smoke',
            environment: 'jsdom',
            include: ['tests/smoke/**/*.test.tsx'],
            setupFiles: SETUP_FILES,
            testTimeout: 30_000,
          },
        },
        {
          extends: true,
          test: {
            name: 'contract',
            environment: 'node',
            include: ['tests/contract/**/*.contract.test.ts'],
            testTimeout: 60_000,
          },
        },
      ],
    },
  }),
);
