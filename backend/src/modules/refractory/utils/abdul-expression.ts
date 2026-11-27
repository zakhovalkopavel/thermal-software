import type { AbdulFunctionEntry } from '../types/abdul-function-entry.type';

const MAX_PASSES = 48;
const NUMBER = /[-+]?(?:\d+\.?\d*|\.\d+)(?:[Ee][-+]?\d+)?/;

/**
 * Evaluates Abdul TDB-style arithmetic expressions at temperature T [K].
 *
 * FUNCTION names are text-substituted from the staging `functions` map, then
 * LN / EXP / + − * / ** and parentheses are evaluated.
 */
export class AbdulExpression {
  static evaluate(
    expression: string,
    T_K: number,
    functions: Record<string, AbdulFunctionEntry>,
  ): number {
    const expanded = AbdulExpression.expandNames(expression, functions);
    const withT = expanded.replace(/\bT\b/g, `(${T_K})`);
    return AbdulExpression.evalRpn(AbdulExpression.toRpn(AbdulExpression.tokenize(withT)));
  }

  private static expandNames(
    expression: string,
    functions: Record<string, AbdulFunctionEntry>,
  ): string {
    const names = Object.keys(functions).sort((a, b) => b.length - a.length);
    let out = expression;
    for (let pass = 0; pass < MAX_PASSES; pass++) {
      let changed = false;
      for (const name of names) {
        const re = new RegExp(`\\b${AbdulExpression.escape(name)}\\b`);
        if (!re.test(out)) continue;
        const entry = functions[name];
        const body = entry.kind === 'einstein_factor' && entry.theta_K != null
          ? `(1-EXP(${-entry.theta_K}/T))`
          : `(${entry.expression})`;
        out = out.replace(new RegExp(`\\b${AbdulExpression.escape(name)}\\b`, 'g'), body);
        changed = true;
      }
      if (!changed) return out;
    }
    throw new Error(`Abdul expression name expansion exceeded ${MAX_PASSES} passes`);
  }

  private static tokenize(expression: string): string[] {
    const s = expression.replace(/\s+/g, '').toUpperCase();
    const tokens: string[] = [];
    let i = 0;
    while (i < s.length) {
      if (s.startsWith('LN', i)) {
        tokens.push('LN');
        i += 2;
        continue;
      }
      if (s.startsWith('EXP', i)) {
        tokens.push('EXP');
        i += 3;
        continue;
      }
      if (s.startsWith('**', i)) {
        tokens.push('**');
        i += 2;
        continue;
      }
      const ch = s[i];
      if ('+-*/()'.includes(ch)) {
        tokens.push(ch);
        i++;
        continue;
      }
      const m = s.slice(i).match(NUMBER);
      if (m && m.index === 0) {
        tokens.push(m[0]);
        i += m[0].length;
        continue;
      }
      throw new Error(`Unexpected token in Abdul expression at "${s.slice(i, i + 20)}"`);
    }
    return AbdulExpression.unaryMinus(tokens);
  }

  /** Turn binary-looking leading/after-operator minuses into unary 0-x. */
  private static unaryMinus(tokens: string[]): string[] {
    const out: string[] = [];
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      const prev = out[out.length - 1];
      if (t === '-' && (out.length === 0 || prev === '(' || '+-*/**'.includes(prev) || prev === 'LN' || prev === 'EXP')) {
        out.push('0', '-');
        continue;
      }
      out.push(t);
    }
    return out;
  }

  private static toRpn(tokens: string[]): string[] {
    const output: string[] = [];
    const ops: string[] = [];
    const prec: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2, '**': 3, LN: 4, EXP: 4 };
    const rightAssoc = new Set(['**', 'LN', 'EXP']);
    for (const token of tokens) {
      if (NUMBER.test(token) && !['LN', 'EXP'].includes(token)) {
        output.push(token);
        continue;
      }
      if (token === 'LN' || token === 'EXP') {
        ops.push(token);
        continue;
      }
      if (token === '(') {
        ops.push(token);
        continue;
      }
      if (token === ')') {
        while (ops.length && ops[ops.length - 1] !== '(') output.push(ops.pop()!);
        if (ops.pop() !== '(') throw new Error('Unbalanced parentheses');
        if (ops.length && (ops[ops.length - 1] === 'LN' || ops[ops.length - 1] === 'EXP')) {
          output.push(ops.pop()!);
        }
        continue;
      }
      while (ops.length) {
        const top = ops[ops.length - 1];
        if (top === '(') break;
        const pTop = prec[top] ?? 0;
        const pTok = prec[token] ?? 0;
        if (pTop > pTok || (pTop === pTok && !rightAssoc.has(token))) output.push(ops.pop()!);
        else break;
      }
      ops.push(token);
    }
    while (ops.length) {
      const op = ops.pop()!;
      if (op === '(') throw new Error('Unbalanced parentheses');
      output.push(op);
    }
    return output;
  }

  private static evalRpn(rpn: string[]): number {
    const stack: number[] = [];
    for (const token of rpn) {
      if (NUMBER.test(token) && token !== 'LN' && token !== 'EXP') {
        stack.push(Number(token));
        continue;
      }
      if (token === 'LN' || token === 'EXP') {
        const x = stack.pop();
        if (x === undefined) throw new Error(`Missing argument for ${token}`);
        stack.push(token === 'LN' ? Math.log(x) : Math.exp(x));
        continue;
      }
      const b = stack.pop();
      const a = stack.pop();
      if (a === undefined || b === undefined) throw new Error(`Missing operands for ${token}`);
      switch (token) {
        case '+': stack.push(a + b); break;
        case '-': stack.push(a - b); break;
        case '*': stack.push(a * b); break;
        case '/': stack.push(a / b); break;
        case '**': stack.push(a ** b); break;
        default: throw new Error(`Unknown operator ${token}`);
      }
    }
    if (stack.length !== 1) throw new Error('Invalid Abdul expression');
    return stack[0];
  }

  private static escape(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
