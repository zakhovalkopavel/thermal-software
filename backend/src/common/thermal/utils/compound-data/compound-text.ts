import { FORMULA_SUBSCRIPT_MAP } from './constants/formula-subscript-map.constants';

const ELEMENT = /([A-Z][a-z]?)(\d*)/g;

/**
 * Text and formula helpers for compound-data identity matching.
 */
export class CompoundText {
  /** Canonical CAS form: digits and hyphens only (already-hyphenated ids kept). */
  static normalizeCas(raw: string): string {
    const trimmed = raw.trim();
    if (/^\d{2,7}-\d{2}-\d$/.test(trimmed)) return trimmed;
    const digits = trimmed.replace(/\D/g, '');
    if (digits.length < 5) return trimmed.toLowerCase();
    return `${digits.slice(0, -3)}-${digits.slice(-3, -1)}-${digits.slice(-1)}`;
  }

  /** Strip HTML `<sub>`/`<sup>`, unicode sub/superscripts, and whitespace. */
  static normalizeFormula(raw: string): string {
    return raw
      .replace(/<\/?sub>/gi, '')
      .replace(/<\/?sup>/gi, '')
      .replace(/[₀₁₂₃₄₅₆₇₈₉⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (ch) => FORMULA_SUBSCRIPT_MAP[ch] ?? ch)
      .replace(/\s+/g, '')
      .trim();
  }

  /** Lowercased, trimmed text for name / synonym matching. */
  static normalizeName(raw: string): string {
    return raw.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  /**
   * Hill formula: C, H, then alphabetical; without carbon, alphabetical.
   * Throws when the formula string is not a plain element-count expression.
   */
  static hillFormula(formula: string): string {
    const counts = new Map<string, number>();
    let consumed = '';
    for (const match of formula.matchAll(ELEMENT)) {
      const element = match[1];
      counts.set(element, (counts.get(element) ?? 0) + (match[2] ? Number(match[2]) : 1));
      consumed += match[0];
    }
    if (consumed !== formula) throw new Error(`Unreadable formula "${formula}"`);
    const token = (element: string) => {
      const n = counts.get(element)!;
      return element + (n > 1 ? String(n) : '');
    };
    const rest = [...counts.keys()].filter((element) => element !== 'C' && element !== 'H').sort();
    const order = counts.has('C')
      ? ['C', ...(counts.has('H') ? ['H'] : []), ...rest]
      : [...counts.keys()].sort();
    return order.map(token).join('');
  }

  /** Like `hillFormula`, but returns undefined instead of throwing. */
  static tryHillFormula(formula: string): string | undefined {
    try {
      return CompoundText.hillFormula(formula);
    } catch {
      return undefined;
    }
  }

  /** Formula search keys for one string: stripped form + Hill form when parseable. */
  static formulaSearchKeys(raw: string): string[] {
    const stripped = CompoundText.normalizeFormula(raw);
    if (!stripped) return [];
    const keys = new Set<string>([stripped, stripped.toUpperCase()]);
    const hill = CompoundText.tryHillFormula(stripped);
    if (hill) keys.add(hill);
    return [...keys];
  }
}
