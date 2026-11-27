/**
 * Evaluates Mao Table III end-member °G expressions that reference oxide G values.
 * Supports forms like `2°GAl2O3 + 3°GSiO2 + 300000`.
 */
export class MaoEndmemberExpression {
  static evaluate(expressionRaw: string, gAl2O3: number, gCaO: number, gSiO2: number): number {
    let s = expressionRaw.replace(/°/g, '').replace(/\s+/g, '');
    s = s.replace(/2GAl2O3/g, String(2 * gAl2O3));
    s = s.replace(/GAl2O3/g, String(gAl2O3));
    s = s.replace(/2GCaO/g, String(2 * gCaO));
    s = s.replace(/GCaO/g, String(gCaO));
    s = s.replace(/3GSiO2/g, String(3 * gSiO2));
    s = s.replace(/GSiO2/g, String(gSiO2));
    const terms = s.match(/[+-]?[0-9]*\.?[0-9]+(?:[eE][+-]?[0-9]+)?/g);
    if (!terms || terms.length === 0) {
      throw new Error(`Cannot evaluate Mao end-member "${expressionRaw}"`);
    }
    return terms.reduce((sum, term) => sum + Number(term), 0);
  }
}
