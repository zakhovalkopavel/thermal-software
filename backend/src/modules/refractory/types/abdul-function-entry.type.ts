/** One Thermo-Calc FUNCTION body from Abdul 2023 Appendix B. */
export type AbdulFunctionEntry = {
  Tmin_K: number;
  Tmax_K: number;
  expression: string;
  kind: 'einstein_factor' | 'expression';
  theta_K?: number;
};
