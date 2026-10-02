/**
 * Element counts of a chemical formula.
 *
 * Supports element symbols with integer or decimal counts (`Fe0.95O`), nested groups in
 * parentheses or brackets (`Ca3(PO4)2`), and adducts / hydrates joined by `·` or `*`
 * with an optional leading multiplier (`CaSO4·2H2O`, `3Al2O3·2SiO2`).
 * Element symbols are not validated against the periodic table.
 */
export function parseFormula(formula: string): Record<string, number> {
  const atoms: Record<string, number> = {};
  for (const part of formula.split(/[·*]/)) {
    const lead = /^(\d+(?:\.\d+)?)/.exec(part);
    const multiplier = lead ? Number(lead[1]) : 1;
    const body = lead ? part.slice(lead[1].length) : part;
    if (!body) throw new Error(`Unsupported chemical formula: ${formula}`);
    for (const [el, n] of Object.entries(parseGroup(body, formula))) {
      atoms[el] = (atoms[el] ?? 0) + n * multiplier;
    }
  }
  return atoms;
}

const CLOSING: Record<string, string> = { '(': ')', '[': ']' };

function parseGroup(body: string, formula: string): Record<string, number> {
  const stack: Record<string, number>[] = [{}];
  const closers: string[] = [];
  const token = /([A-Z][a-z]?)|([([])|([)\]])|(\d+(?:\.\d+)?)/y;
  let last: Record<string, number> | null = null;
  let i = 0;
  while (i < body.length) {
    token.lastIndex = i;
    const m = token.exec(body);
    if (!m) throw new Error(`Unsupported chemical formula: ${formula}`);
    i = token.lastIndex;
    const top = stack[stack.length - 1];
    if (m[1]) {
      top[m[1]] = (top[m[1]] ?? 0) + 1;
      last = { [m[1]]: 1 };
    } else if (m[2]) {
      stack.push({});
      closers.push(CLOSING[m[2]]);
      last = null;
    } else if (m[3]) {
      if (closers.pop() !== m[3] || stack.length < 2) throw new Error(`Unbalanced chemical formula: ${formula}`);
      const group = stack.pop()!;
      const parent = stack[stack.length - 1];
      for (const [el, n] of Object.entries(group)) parent[el] = (parent[el] ?? 0) + n;
      last = group;
    } else {
      if (!last) throw new Error(`Unsupported chemical formula: ${formula}`);
      const count = Number(m[4]);
      const target = stack[stack.length - 1];
      for (const [el, n] of Object.entries(last)) target[el] += n * (count - 1);
      last = null;
    }
  }
  if (stack.length !== 1) throw new Error(`Unbalanced chemical formula: ${formula}`);
  return stack[0];
}
