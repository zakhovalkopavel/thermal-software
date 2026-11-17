import { StructureRuleId } from '../types/structure-rule-id.type';

/** Human-readable messages for new (non-baseline) structure violations. */
export class StructureViolationMessage {
  static forOverLimit(ruleId: StructureRuleId, file: string, count: number): string {
    switch (ruleId) {
      case 'multipleExports':
        return `${file}: exports ${count} constructs — split to one construct per file `
          + '(docs/CONVENTIONS.md § SRP).';
      case 'mixedConstructKinds':
        return `${file}: mixes ${count} construct kinds — keep one kind per file `
          + '(docs/CONVENTIONS.md § SRP).';
      case 'exportedFreeFunctions':
        return `${file}: exports ${count} free functions — move to a static class `
          + '(docs/CONVENTIONS.md § no free-function families).';
      case 'suffixFolderMismatch':
        return `${file}: file suffix does not match its construct folder `
          + '(docs/CONVENTIONS.md § Construct → folder → file).';
      case 'helperFiles':
        return `${file}: *.helper.ts is not allowed for new code — use a service or static class `
          + '(docs/CONVENTIONS.md § Choosing the form).';
      default: {
        const _exhaustive: never = ruleId;
        return `${file}: structure violation (${_exhaustive as string}, severity ${count}).`;
      }
    }
  }
}
