import { StructureChecker } from './utils/structure-checker';
import { StructureFileAnalyser } from './utils/structure-file-analyser';
import { StructurePathRules } from './utils/structure-path-rules';

describe('StructureFileAnalyser', () => {
  it('counts a single exported type as one construct', () => {
    const result = StructureFileAnalyser.analyse(
      'src/modules/x/types/foo.type.ts',
      'export type Foo = { a: number };\n',
    );
    expect(result).toMatchObject({
      exportCount: 1,
      kindCount: 1,
      functionCount: 0,
      kinds: ['type'],
      suffixFolderMismatch: false,
      isHelperFile: false,
    });
  });

  it('detects multiple exports and mixed kinds', () => {
    const result = StructureFileAnalyser.analyse(
      'src/modules/x/known-fluid.type.ts',
      [
        'export type KnownFluid = string;',
        'export const KNOWN_FLUIDS = ["air"] as const;',
        'export function normalizeKnownFluid(v: string): string { return v; }',
      ].join('\n'),
    );
    expect(result.exportCount).toBe(3);
    expect(result.kindCount).toBe(3);
    expect(result.functionCount).toBe(1);
    expect(result.kinds.sort()).toEqual(['const', 'function', 'type']);
  });

  it('counts each declarator in an exported variable statement', () => {
    const result = StructureFileAnalyser.analyse(
      'src/modules/x/constants/pair.constants.ts',
      'export const A = 1, B = 2;\n',
    );
    expect(result.exportCount).toBe(2);
    expect(result.kinds).toEqual(['const']);
  });

  it('counts exported free-function families', () => {
    const result = StructureFileAnalyser.analyse(
      'src/modules/x/utils/series.util.ts',
      [
        'export function a(): number { return 1; }',
        'export function b(): number { return 2; }',
      ].join('\n'),
    );
    expect(result.functionCount).toBe(2);
    expect(result.exportCount).toBe(2);
  });

  it('ignores non-exported declarations', () => {
    const result = StructureFileAnalyser.analyse(
      'src/modules/x/services/foo.service.ts',
      [
        'const helper = 1;',
        'function local(): void {}',
        'export class FooService {}',
      ].join('\n'),
    );
    expect(result.exportCount).toBe(1);
    expect(result.kinds).toEqual(['class']);
  });
});

describe('StructurePathRules', () => {
  it.each([
    ['src/modules/x/interfaces/foo.interface.ts', false],
    ['src/modules/x/types/foo.type.ts', false],
    ['src/common/thermal/type/foo.type.ts', false],
    ['src/modules/x/constants/foo.constants.ts', false],
    ['src/modules/x/enums/foo.enum.ts', false],
    ['src/common/thermal/enum/foo.enum.ts', false],
    ['src/common/utils/quadrature/foo.interface.ts', true],
    ['src/common/chemistry/foo.type.ts', true],
    ['src/modules/x/interfaces/foo.type.ts', true],
    ['src/modules/x/utils/foo.constants.ts', true],
    ['src/modules/x/constants/viscosity-parameters.ts', true],
  ])('%s → mismatch=%s', (label, expected) => {
    expect(StructurePathRules.hasSuffixFolderMismatch(label)).toBe(expected);
  });
});

describe('StructureChecker', () => {
  it('reports a new multiple-exports violation', () => {
    const measured = StructureChecker.emptyBaseline();
    measured.multipleExports['src/a.ts'] = 3;
    const result = StructureChecker.findViolations(measured, StructureChecker.emptyBaseline());
    expect(result).toEqual([
      expect.objectContaining({
        kind: 'over-limit',
        ruleId: 'multipleExports',
        file: 'src/a.ts',
        count: 3,
      }),
    ]);
  });

  it('accepts a baseline file that stays the same severity', () => {
    const measured = StructureChecker.emptyBaseline();
    measured.helperFiles['src/a.helper.ts'] = 1;
    const baseline = StructureChecker.emptyBaseline();
    baseline.helperFiles['src/a.helper.ts'] = 1;
    expect(StructureChecker.findViolations(measured, baseline)).toEqual([]);
  });

  it('reports growth, ratchet, and stale entries', () => {
    const measured = StructureChecker.emptyBaseline();
    measured.multipleExports['src/grew.ts'] = 4;
    measured.multipleExports['src/shrink.ts'] = 2;
    const baseline = StructureChecker.emptyBaseline();
    baseline.multipleExports['src/grew.ts'] = 3;
    baseline.multipleExports['src/shrink.ts'] = 3;
    baseline.multipleExports['src/gone.ts'] = 2;

    const kinds = StructureChecker.findViolations(measured, baseline).map(v => v.kind).sort();
    expect(kinds).toEqual(['grew', 'ratchet', 'stale']);
  });
});
