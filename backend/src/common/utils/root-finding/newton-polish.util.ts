/**
 * Refine a root estimate using Newton-Raphson iterations.
 * Use after brentq to tighten |f(root)| to near machine precision.
 * Equivalent to a few steps of scipy.optimize.newton(f, x0, fprime=df)
 *
 * @param f    Function whose root is sought
 * @param df   Derivative of f
 * @param x0   Initial estimate (e.g. from brentq)
 * @param tol  Stop when |f(x)| < tol (default 1e-14)
 */
export function newtonPolish(
  f: (x: number) => number,
  df: (x: number) => number,
  x0: number,
  tol = 1e-14,
): number {
  let x = x0;
  for (let i = 0; i < 10; i++) {
    const fx = f(x);
    if (Math.abs(fx) < tol) break;
    const dfx = df(x);
    if (Math.abs(dfx) < 1e-30) break;
    x -= fx / dfx;
  }
  return x;
}
