import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { FILE_LENGTH_RULES } from './constants/file-length-rules.constants';
import { FileLengthRule } from './types/file-length-rule.type';
import { FileLengthChecker } from './utils/file-length-checker';

const lines = (count: number): string => Array.from({ length: count }, (_, i) => `line ${i}`).join('\n') + '\n';

const RULE: FileLengthRule = {
  name: 'sample',
  root: 'src',
  extensions: ['.ts'],
  excludePatterns: [/\.spec\.ts$/, /(^|\/)data\//],
  maxLines: 10,
};

describe('FileLengthChecker', () => {
  let tmp: string;

  const write = (relative: string, content: string): void => {
    const full = path.join(tmp, relative);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  };

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'file-length-'));
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  describe('countLines', () => {
    it.each([
      ['', 0],
      ['a', 1],
      ['a\n', 1],
      ['a\nb', 2],
      ['a\nb\n', 2],
      ['a\n\n', 2],
      ['\n', 1],
      ['a\r\nb\r\n', 2],
    ])('counts %j as %i line(s)', (content, expected) => {
      expect(FileLengthChecker.countLines(content)).toBe(expected);
    });
  });

  describe('measure', () => {
    it('labels files with the rule root and POSIX separators', () => {
      write('modules/a/a.service.ts', lines(3));
      expect(FileLengthChecker.measure(tmp, RULE)).toEqual({ 'src/modules/a/a.service.ts': 3 });
    });

    it('ignores other extensions, excluded patterns and skipped directories', () => {
      write('keep.ts', lines(2));
      write('notes.md', lines(50));
      write('keep.spec.ts', lines(50));
      write('modules/x/data/table.ts', lines(5000));
      write('node_modules/pkg/index.ts', lines(50));
      write('dist/out.ts', lines(50));
      expect(FileLengthChecker.measure(tmp, RULE)).toEqual({ 'src/keep.ts': 2 });
    });

    it('does not exempt similarly named files that are not data', () => {
      write('modules/metadata/meta.ts', lines(12));
      expect(FileLengthChecker.measure(tmp, RULE)).toEqual({ 'src/modules/metadata/meta.ts': 12 });
    });
  });

  describe('findViolations', () => {
    it('accepts files at or under the limit', () => {
      const measured = { 'src/a.ts': 10, 'src/b.ts': 1 };
      expect(FileLengthChecker.findViolations(measured, RULE, {})).toEqual([]);
    });

    it('reports a file over the limit that is not in the baseline', () => {
      const result = FileLengthChecker.findViolations({ 'src/a.ts': 11 }, RULE, {});
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ kind: 'over-limit', file: 'src/a.ts', lines: 11, limit: 10 });
      expect(result[0].message).toContain('split it');
    });

    it('accepts a baseline file that stays the same size', () => {
      expect(FileLengthChecker.findViolations({ 'src/a.ts': 25 }, RULE, { 'src/a.ts': 25 })).toEqual([]);
    });

    it('reports a baseline file that grew', () => {
      const result = FileLengthChecker.findViolations({ 'src/a.ts': 26 }, RULE, { 'src/a.ts': 25 });
      expect(result).toEqual([expect.objectContaining({ kind: 'grew', lines: 26, baseline: 25 })]);
    });

    it('asks to lower the baseline when a baseline file shrank but is still over the limit', () => {
      const result = FileLengthChecker.findViolations({ 'src/a.ts': 20 }, RULE, { 'src/a.ts': 25 });
      expect(result).toEqual([expect.objectContaining({ kind: 'ratchet', lines: 20, baseline: 25 })]);
      expect(result[0].message).toContain('from 25 to 20');
    });

    it('reports a baseline entry whose file is now within the limit', () => {
      const result = FileLengthChecker.findViolations({ 'src/a.ts': 9 }, RULE, { 'src/a.ts': 25 });
      expect(result).toEqual([expect.objectContaining({ kind: 'stale', file: 'src/a.ts' })]);
    });

    it('reports a baseline entry whose file no longer exists', () => {
      const result = FileLengthChecker.findViolations({}, RULE, { 'src/gone.ts': 25 });
      expect(result).toEqual([expect.objectContaining({ kind: 'stale', file: 'src/gone.ts', lines: 0 })]);
    });

    it('ignores baseline entries that belong to other roots', () => {
      expect(FileLengthChecker.findViolations({}, RULE, { 'docs/A.md': 900, 'test/x.ts': 900 })).toEqual([]);
    });

    it('returns violations sorted by file', () => {
      const measured = { 'src/b.ts': 11, 'src/a.ts': 12 };
      const files = FileLengthChecker.findViolations(measured, RULE, {}).map(v => v.file);
      expect(files).toEqual(['src/a.ts', 'src/b.ts']);
    });
  });

  describe('resolveRoot', () => {
    it('returns the backend subdirectory for src and test', () => {
      fs.mkdirSync(path.join(tmp, 'src'));
      expect(FileLengthChecker.resolveRoot(tmp, 'src')).toBe(path.join(tmp, 'src'));
      expect(FileLengthChecker.resolveRoot(tmp, 'test')).toBeNull();
    });

    it('finds docs next to the backend directory (host layout)', () => {
      fs.mkdirSync(path.join(tmp, 'backend'));
      fs.mkdirSync(path.join(tmp, 'docs'));
      const backend = path.join(tmp, 'backend');
      expect(FileLengthChecker.resolveRoot(backend, 'docs')).toBe(path.join(backend, '..', 'docs'));
    });

    it('falls back to docs inside the backend directory', () => {
      fs.mkdirSync(path.join(tmp, 'docs'));
      expect(FileLengthChecker.resolveRoot(tmp, 'docs')).toBe(path.join(tmp, 'docs'));
    });

    it('returns null when docs is not available', () => {
      expect(FileLengthChecker.resolveRoot(path.join(tmp, 'backend-missing'), 'docs')).toBeNull();
    });
  });
});

describe('FILE_LENGTH_RULES', () => {
  const rule = (root: FileLengthRule['root']): FileLengthRule => FILE_LENGTH_RULES.find(r => r.root === root);

  it('defines positive limits for src, test and docs', () => {
    expect(FILE_LENGTH_RULES.map(r => r.root).sort()).toEqual(['docs', 'src', 'test']);
    FILE_LENGTH_RULES.forEach(r => expect(r.maxLines).toBeGreaterThan(0));
  });

  it.each([
    'src/modules/refractory/data/materials/materials-oxide.data.ts',
    'src/modules/refractory/data/component-properties.data.ts',
    'src/common/thermal/compound/gas/n2.ts',
    'src/common/thermal/enum/ref-key.enum.ts',
    'src/modules/x/some.spec.ts',
  ])('exempts %s from the src rule', file => {
    expect(rule('src').excludePatterns.some(pattern => pattern.test(file))).toBe(true);
  });

  it.each([
    'src/modules/refractory/services/composition/glass-viscosity.service.ts',
    'src/modules/compounds/services/compound-search.service.ts',
    'src/modules/refractory/constants/viscosity-parameters.ts',
  ])('applies the src rule to %s', file => {
    expect(rule('src').excludePatterns.some(pattern => pattern.test(file))).toBe(false);
  });
});
