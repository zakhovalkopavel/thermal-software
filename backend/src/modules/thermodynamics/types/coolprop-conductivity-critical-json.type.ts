/**
 * Wire shape of CoolProp `TRANSPORT.conductivity[].critical` (vendored JSON).
 */
export type CoolpropConductivityCriticalJson =
  | {
      type: 'simplified_Olchowy_Sengers';
      R0?: number;
      gamma?: number;
      nu?: number;
      GAMMA?: number;
      zeta0?: number;
      qD?: number;
      T_ref?: number;
      /** Free-text CoolProp note; ignored at evaluation */
      note?: string;
    }
  | {
      hardcoded: string;
    };
