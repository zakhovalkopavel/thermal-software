/**
 * uniform   — T(x, 0) = T0 = const. Standard base-case series.
 * parabolic — T(x, 0) = Tctr − (Tctr − Tsurf)·(x/R)².
 *             Uses exact analytical modifier Cm/Cn*; no numerical integration.
 * arbitrary — T(x, 0) = f(x) via user-supplied callback.
 *             Fourier coefficients computed numerically (Simpson's rule).
 */
export type InitialProfileKind = 'uniform' | 'parabolic' | 'arbitrary';
