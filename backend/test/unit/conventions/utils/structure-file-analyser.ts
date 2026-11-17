import * as ts from 'typescript';
import { ExportedConstructKind } from '../types/exported-construct-kind.type';
import { StructureFileAnalysis } from '../types/structure-file-analysis.type';
import { StructurePathRules } from './structure-path-rules';

/**
 * AST analysis of one TypeScript file for exported constructs and placement flags.
 */
export class StructureFileAnalyser {
  /** Analyse one file's source text. */
  static analyse(label: string, content: string): StructureFileAnalysis {
    const sourceFile = ts.createSourceFile(label, content, ts.ScriptTarget.Latest, true);
    const kinds: ExportedConstructKind[] = [];
    let functionCount = 0;

    for (const statement of sourceFile.statements) {
      if (ts.isVariableStatement(statement) && StructureFileAnalyser.hasExportModifier(statement)) {
        for (const _declarator of statement.declarationList.declarations) {
          kinds.push('const');
        }
        continue;
      }
      const kind = StructureFileAnalyser.exportedKind(statement);
      if (kind === null) continue;
      kinds.push(kind);
      if (kind === 'function') functionCount += 1;
    }

    const uniqueKinds = [...new Set(kinds)];
    return {
      exportCount: kinds.length,
      kindCount: uniqueKinds.length,
      functionCount,
      kinds: uniqueKinds,
      suffixFolderMismatch: StructurePathRules.hasSuffixFolderMismatch(label),
      isHelperFile: label.endsWith('.helper.ts'),
    };
  }

  private static exportedKind(statement: ts.Statement): ExportedConstructKind | null {
    if (ts.isTypeAliasDeclaration(statement) && StructureFileAnalyser.hasExportModifier(statement)) {
      return 'type';
    }
    if (ts.isInterfaceDeclaration(statement) && StructureFileAnalyser.hasExportModifier(statement)) {
      return 'interface';
    }
    if (ts.isClassDeclaration(statement) && StructureFileAnalyser.hasExportModifier(statement)) {
      return 'class';
    }
    if (ts.isEnumDeclaration(statement) && StructureFileAnalyser.hasExportModifier(statement)) {
      return 'enum';
    }
    if (ts.isFunctionDeclaration(statement) && StructureFileAnalyser.hasExportModifier(statement)) {
      return 'function';
    }
    if (ts.isVariableStatement(statement) && StructureFileAnalyser.hasExportModifier(statement)) {
      return 'const';
    }
    return null;
  }

  private static hasExportModifier(node: ts.Statement | ts.Declaration): boolean {
    const flags = ts.getCombinedModifierFlags(node as ts.Declaration);
    if ((flags & ts.ModifierFlags.Export) !== 0) return true;
    const modifiers = (node as ts.HasModifiers).modifiers;
    return (modifiers ?? []).some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword);
  }
}
