import { formatSignificant } from './format-significant.util';

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
      const val = formatSignificant(paramValues[i]);
      body = body.replace(new RegExp(`\\b${name}\\b`, 'g'), val);
    }

    return `y = ${body}`;
  } catch {
    return modelExpression;
  }
}
