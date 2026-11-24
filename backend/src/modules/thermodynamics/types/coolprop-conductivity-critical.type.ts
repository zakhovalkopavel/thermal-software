/**
 * CoolProp `TRANSPORT.conductivity[].critical` for
 * `simplified_Olchowy_Sengers` (NIST IR 8209 / REFPROP form).
 */
export type CoolpropConductivityCritical = {
  type: 'simplified_Olchowy_Sengers';
  R0: number;
  gamma: number;
  nu: number;
  GAMMA: number;
  zeta0: number;
  qD: number;
  /** Reference temperature [K]; omit → 1.5·T_c at evaluation */
  T_ref?: number;
};
