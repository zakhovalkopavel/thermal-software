/**
 * Numeric response formatters.
 *
 * Builds human-readable formula strings and reshapes raw coefficient arrays
 * into named-key objects for API responses.
 * These are pure presentation helpers — no maths, no side effects.
 */

/** Round to 6 significant figures and strip trailing zeros. */
function fmt(n: number): string {
  return String(parseFloat(n.toPrecision(6)));
}

/**
 * Convert a polynomial coefficient array [c0, c1, …, cn] into a named object
 * { c0: …, c1: …, …, cn: … }.
 *
 * Coefficients are in ascending degree order (c0 = constant, c1 = linear, …).
 */
export function polyCoefficientsToObject(coeffs: number[]): Record<string, number> {
  return Object.fromEntries(coeffs.map((c, i) => [`c${i}`, c]));
}

/**
 * Build a human-readable polynomial formula string.
 *
 * Example: [1.12, -0.62, 1.09]  →  "y = 1.12 - 0.62·x + 1.09·x²"
 */
export function polyFormula(coeffs: number[]): string {
  const terms = coeffs.map((c, i) => {
    const abs = fmt(Math.abs(c));
    const sign = (i === 0) ? (c < 0 ? '-' : '') : (c < 0 ? ' - ' : ' + ');
    if (i === 0) return `${sign}${abs}`;
    if (i === 1) return `${sign}${abs}·x`;
    return `${sign}${abs}·x^${i}`;
  });
  return `y = ${terms.join('')}`;
}

/**
 * Build a human-readable linear formula string.
 *
 * Example: slope=2.04, intercept=-0.1  →  "y = 2.04·x - 0.1"
 */
export function linearFormula(slope: number, intercept: number): string {
  const s = `${slope < 0 ? '-' : ''}${fmt(Math.abs(slope))}`;
  const bSign = intercept < 0 ? ' - ' : ' + ';
  const b = fmt(Math.abs(intercept));
  return `y = ${s}·x${bSign}${b}`;
}

/**
 * Build a human-readable exponential formula string.
 *
 * Example: A=1.5, B=0.3  →  "y = 1.5·e^(0.3·x)"
 */
export function exponentialFormula(A: number, B: number): string {
  return `y = ${fmt(A)}·e^(${fmt(B)}·x)`;
}

/**
 * Build a human-readable power-law formula string.
 *
 * Example: A=2.0, B=1.5  →  "y = 2.0·x^1.5"
 */
export function powerFormula(A: number, B: number): string {
  return `y = ${fmt(A)}·x^${fmt(B)}`;
}

/**
 * Build a formula string for a Levenberg-Marquardt fit by substituting the
 * fitted parameter values into the model expression string.
 *
 * Parses the curried form: `([A,B,...]) => x => <body>`
 * Extracts parameter names from the destructuring pattern and replaces each
 * occurrence in the body with its fitted value.
 *
 * Falls back to returning the raw expression if the pattern cannot be parsed.
 *
 * Example:
 *   expr  = "([A,B]) => x => A * Math.exp(B * x)"
 *   params = [1.0023, 0.9998]
 *   →  "y = 1.0023 * Math.exp(0.9998 * x)"
 */
export function lmFormula(modelExpression: string, paramValues: number[]): string {
  try {
    // Match param names from the leading `([A,B,C]) =>` pattern
    const match = modelExpression.match(/^\(\[([^[\]]+)]\)\s*=>/);
    if (!match) return modelExpression;

    const paramNames = match[1].split(',').map(s => s.trim());

    // Find the second `=>` arrow to locate the body expression
    const firstArrow = modelExpression.indexOf('=>');
    const secondArrow = modelExpression.indexOf('=>', firstArrow + 2);
    if (secondArrow === -1) return modelExpression;

    let body = modelExpression.slice(secondArrow + 2).trim();

    // Substitute each param name with its fitted value (word-boundary safe)
    for (let i = 0; i < paramNames.length && i < paramValues.length; i++) {
      const name = paramNames[i];
      const val = fmt(paramValues[i]);
      body = body.replace(new RegExp(`\\b${name}\\b`, 'g'), val);
    }

    return `y = ${body}`;
  } catch {
    return modelExpression;
  }
}


