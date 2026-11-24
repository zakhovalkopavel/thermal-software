import { describe, expect, it } from 'vitest';

const FILES = Object.keys(import.meta.glob('/src/**/mappers/*.ts'));
const TEST_SUFFIX = '.test.ts';

describe('mapper coverage', () => {
  it('finds the mappers', () => {
    expect(FILES.length).toBeGreaterThan(0);
  });

  it('has a test file next to every mapper', () => {
    const files = new Set(FILES);
    const untested = FILES.filter((file) => !file.endsWith(TEST_SUFFIX) && !files.has(file.replace(/\.ts$/, TEST_SUFFIX)));
    expect(untested, 'Add a <name>.test.ts next to each listed mapper').toEqual([]);
  });
});
