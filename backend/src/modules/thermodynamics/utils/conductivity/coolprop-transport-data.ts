import * as fs from 'fs';
import * as path from 'path';
import { OLCHOWY_SENGERS } from '../../constants/olchowy-sengers.constants';
import { CoolpropConductivityCritical } from '../../types/coolprop-conductivity-critical.type';
import { CoolpropConductivityDilute } from '../../types/coolprop-conductivity-dilute.type';
import { CoolpropConductivityModel } from '../../types/coolprop-conductivity-model.type';
import { CoolpropConductivityResidual } from '../../types/coolprop-conductivity-residual.type';
import { CoolpropHelmholtzData } from '../density/coolprop-helmholtz-data';

/**
 * Cached CoolProp `TRANSPORT.conductivity` models from fluid JSON.
 * Refs: [CoolProp], [NISTIR8209].
 */
export class CoolpropTransportData {
  private static cache = new Map<string, CoolpropConductivityModel | null>();

  static resetCache(): void {
    CoolpropTransportData.cache.clear();
  }

  /**
   * Parsed conductivity model, or `null` when the fluid has none we can use
   * (hardcoded-only, missing TRANSPORT, unsupported residual-only without dilute fallback).
   */
  static loadConductivity(coolpropKey: string): CoolpropConductivityModel | null {
    if (CoolpropTransportData.cache.has(coolpropKey)) {
      return CoolpropTransportData.cache.get(coolpropKey) ?? null;
    }
    const file = path.join(CoolpropHelmholtzData.dir(), 'fluids', `${coolpropKey}.json`);
    if (!fs.existsSync(file)) {
      CoolpropTransportData.cache.set(coolpropKey, null);
      return null;
    }
    const doc = JSON.parse(fs.readFileSync(file, 'utf8')) as {
      TRANSPORT?: { conductivity?: unknown };
    };
    const parsed = CoolpropTransportData.parseConductivity(doc.TRANSPORT?.conductivity);
    CoolpropTransportData.cache.set(coolpropKey, parsed);
    return parsed;
  }

  private static parseConductivity(raw: unknown): CoolpropConductivityModel | null {
    if (!raw || typeof raw !== 'object') return null;
    const block = Array.isArray(raw) ? raw[0] : raw;
    if (!block || typeof block !== 'object' || Array.isArray(block)) return null;
    const row = block as Record<string, unknown>;
    if (typeof row.hardcoded === 'string') return null;

    const dilute = CoolpropTransportData.parseDilute(row.dilute);
    const residual = CoolpropTransportData.parseResidual(row.residual);
    const critical = CoolpropTransportData.parseCritical(row.critical);
    if (!dilute && !residual) return null;
    return {
      ...(dilute ? { dilute } : {}),
      ...(residual ? { residual } : {}),
      ...(critical ? { critical } : {}),
    };
  }

  private static parseCritical(raw: unknown): CoolpropConductivityCritical | undefined {
    if (!raw || typeof raw !== 'object') return undefined;
    const c = raw as Record<string, unknown>;
    if (c.type !== 'simplified_Olchowy_Sengers') return undefined;
    const R0 = typeof c.R0 === 'number' ? c.R0 : OLCHOWY_SENGERS.R0;
    const gamma = typeof c.gamma === 'number' ? c.gamma : OLCHOWY_SENGERS.GAMMA_EXPONENT;
    const nu = typeof c.nu === 'number' ? c.nu : OLCHOWY_SENGERS.NU;
    const GAMMA = typeof c.GAMMA === 'number' ? c.GAMMA : OLCHOWY_SENGERS.GAMMA;
    const zeta0 = typeof c.zeta0 === 'number' ? c.zeta0 : OLCHOWY_SENGERS.ZETA0_M;
    const qD = typeof c.qD === 'number' ? c.qD : OLCHOWY_SENGERS.QD_PER_M;
    if (![R0, gamma, nu, GAMMA, zeta0, qD].every(Number.isFinite)) return undefined;
    const T_ref = typeof c.T_ref === 'number' ? c.T_ref : undefined;
    return {
      type: 'simplified_Olchowy_Sengers',
      R0,
      gamma,
      nu,
      GAMMA,
      zeta0,
      qD,
      ...(T_ref !== undefined ? { T_ref } : {}),
    };
  }

  private static parseDilute(raw: unknown): CoolpropConductivityDilute | undefined {
    if (!raw || typeof raw !== 'object') return undefined;
    const d = raw as Record<string, unknown>;
    if (d.type !== 'ratio_of_polynomials') return undefined;
    const A = d.A as number[] | undefined;
    const B = d.B as number[] | undefined;
    const n = d.n as number[] | undefined;
    const m = d.m as number[] | undefined;
    const T_reducing = d.T_reducing as number | undefined;
    if (!A?.length || !B?.length || !n?.length || !m?.length || T_reducing === undefined) {
      return undefined;
    }
    return { type: 'ratio_of_polynomials', T_reducing, A, n, B, m };
  }

  private static parseResidual(raw: unknown): CoolpropConductivityResidual | undefined {
    if (!raw || typeof raw !== 'object') return undefined;
    const r = raw as Record<string, unknown>;
    if (r.type === 'polynomial') {
      const B = r.B as number[] | undefined;
      const t = r.t as number[] | undefined;
      const d = r.d as number[] | undefined;
      const T_reducing = r.T_reducing as number | undefined;
      const rhomass_reducing = r.rhomass_reducing as number | undefined;
      if (!B?.length || !t?.length || !d?.length
        || T_reducing === undefined || rhomass_reducing === undefined) {
        return undefined;
      }
      return { type: 'polynomial', B, t, d, T_reducing, rhomass_reducing };
    }
    if (r.type === 'polynomial_and_exponential') {
      const A = r.A as number[] | undefined;
      const t = r.t as number[] | undefined;
      const d = r.d as number[] | undefined;
      const gamma = r.gamma as number[] | undefined;
      const l = r.l as number[] | undefined;
      if (!A?.length || !t?.length || !d?.length || !gamma?.length || !l?.length) {
        return undefined;
      }
      return { type: 'polynomial_and_exponential', A, t, d, gamma, l };
    }
    return undefined;
  }
}
