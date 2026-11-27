import { celsiusToKelvin } from '../../../common/thermal/utils/temperature/celsius-to-kelvin.util';
import type { MaoSiteFractions } from '../types/mao-site-fractions.type';
import { MaoLiquidDataset } from './mao-liquid-dataset';

type Anion = 'AlO2' | 'O' | 'SiO4' | 'SiO2';

/** Redlich–Kister / reciprocal L terms of the Mao ionic CAS liquid at fixed site fractions. */
export class MaoIonicExcess {
  static excessL_Jmol(sites: MaoSiteFractions, temperature_C: number): number {
    const T_K = celsiusToKelvin(temperature_C);
    const yC = sites.cations;
    const yA = sites.anions;
    let gEx = 0;
    for (const row of MaoLiquidDataset.load().phases.liquid_ionic_CAS.interactions as Array<{
      order: number;
      parameter: string;
      a: number | null;
      b: number | null;
    }>) {
      const L = (row.a ?? 0) + (row.b ?? 0) * T_K;
      if (!Number.isFinite(L)) continue;
      gEx += MaoIonicExcess.term(row.parameter, row.order, L, yC, yA);
    }
    return gEx;
  }

  private static term(
    parameter: string,
    order: number,
    L: number,
    yC: MaoSiteFractions['cations'],
    yA: MaoSiteFractions['anions'],
  ): number {
    const cat = parameter.match(/^LAl\+3,Ca\+2:AlO2-1$/);
    if (cat) return yC.Al * yC.Ca * yA.AlO2 * L * (yC.Al - yC.Ca) ** order;

    const an = parameter.match(/^L(Al|Ca)\+[23]:([A-Za-z0-9+]+),([A-Za-z0-9+]+)$/);
    if (an) {
      const cation = an[1] === 'Al' ? yC.Al : yC.Ca;
      const a1 = MaoIonicExcess.anionKey(an[2]);
      const a2 = MaoIonicExcess.anionKey(an[3]);
      if (!a1 || !a2) return 0;
      return cation * yA[a1] * yA[a2] * L * (yA[a1] - yA[a2]) ** order;
    }

    const ter = parameter.match(/^L(Al|Ca)\+[23]:([A-Za-z0-9+]+),([A-Za-z0-9+]+),([A-Za-z0-9+]+)$/);
    if (ter) {
      const cation = ter[1] === 'Al' ? yC.Al : yC.Ca;
      const keys = [ter[2], ter[3], ter[4]].map(MaoIonicExcess.anionKey);
      if (keys.some(k => !k)) return 0;
      const [k1, k2, k3] = keys as [Anion, Anion, Anion];
      return cation * yA[k1] * yA[k2] * yA[k3] * L;
    }
    return 0;
  }

  static anionKey(token: string): Anion | undefined {
    const t = token.replace(/\s+/g, '');
    if (t === 'AlO2-1' || t === 'AlO2') return 'AlO2';
    if (t === 'O-2' || t === 'O') return 'O';
    if (t === 'SiO4-4' || t === 'SiO4') return 'SiO4';
    if (t === 'SiO20' || t === 'SiO2') return 'SiO2';
    return undefined;
  }
}
