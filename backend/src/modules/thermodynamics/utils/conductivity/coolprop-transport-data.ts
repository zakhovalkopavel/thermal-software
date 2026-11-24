import * as fs from 'fs';
import * as path from 'path';
import { OLCHOWY_SENGERS } from '../../constants/olchowy-sengers.constants';
import { CoolpropConductivityBlockJson } from '../../types/coolprop-conductivity-block-json.type';
import { CoolpropConductivityCritical } from '../../types/coolprop-conductivity-critical.type';
import { CoolpropConductivityCriticalJson } from '../../types/coolprop-conductivity-critical-json.type';
import { CoolpropConductivityDilute } from '../../types/coolprop-conductivity-dilute.type';
import { CoolpropConductivityDiluteJson } from '../../types/coolprop-conductivity-dilute-json.type';
import { CoolpropConductivityModel } from '../../types/coolprop-conductivity-model.type';
import { CoolpropConductivityResidual } from '../../types/coolprop-conductivity-residual.type';
import { CoolpropConductivityResidualJson } from '../../types/coolprop-conductivity-residual-json.type';
import { CoolpropFluidTransportJson } from '../../types/coolprop-fluid-transport-json.type';
import { CoolpropHelmholtzData } from '../density/coolprop-helmholtz-data';
import { CoolpropConductivityJsonGuard } from './coolprop-conductivity-json-guard';

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
    const doc = JSON.parse(fs.readFileSync(file, 'utf8')) as CoolpropFluidTransportJson;
    const wire = CoolpropConductivityJsonGuard.asJson(doc.TRANSPORT?.conductivity);
    const parsed = wire
      ? CoolpropTransportData.selectModel(CoolpropConductivityJsonGuard.blocks(wire))
      : null;
    CoolpropTransportData.cache.set(coolpropKey, parsed);
    return parsed;
  }

  /**
   * Prefer the first block with an evaluable residual; else first dilute-only model.
   */
  private static selectModel(
    blocks: CoolpropConductivityBlockJson[],
  ): CoolpropConductivityModel | null {
    let fallback: CoolpropConductivityModel | null = null;
    for (const block of blocks) {
      const model = CoolpropTransportData.toEvaluatedModel(block);
      if (!model) continue;
      if (model.residual) return model;
      if (!fallback) fallback = model;
    }
    return fallback;
  }

  private static toEvaluatedModel(
    block: CoolpropConductivityBlockJson,
  ): CoolpropConductivityModel | null {
    if (typeof block.hardcoded === 'string') return null;
    const dilute = block.dilute
      ? CoolpropTransportData.toEvaluatedDilute(block.dilute)
      : undefined;
    const residual = block.residual
      ? CoolpropTransportData.toEvaluatedResidual(block.residual)
      : undefined;
    const critical = block.critical
      ? CoolpropTransportData.toEvaluatedCritical(block.critical)
      : undefined;
    if (!dilute && !residual) return null;
    return {
      ...(dilute ? { dilute } : {}),
      ...(residual ? { residual } : {}),
      ...(critical ? { critical } : {}),
    };
  }

  private static toEvaluatedDilute(
    d: CoolpropConductivityDiluteJson,
  ): CoolpropConductivityDilute | undefined {
    if (!('type' in d) || d.type !== 'ratio_of_polynomials') return undefined;
    return {
      type: 'ratio_of_polynomials',
      T_reducing: d.T_reducing,
      A: d.A,
      n: d.n,
      B: d.B,
      m: d.m,
    };
  }

  private static toEvaluatedResidual(
    r: CoolpropConductivityResidualJson,
  ): CoolpropConductivityResidual | undefined {
    if (r.type === 'polynomial') {
      return {
        type: 'polynomial',
        B: r.B,
        t: r.t,
        d: r.d,
        T_reducing: r.T_reducing,
        rhomass_reducing: r.rhomass_reducing,
      };
    }
    if (r.type === 'polynomial_and_exponential') {
      return {
        type: 'polynomial_and_exponential',
        A: r.A,
        t: r.t,
        d: r.d,
        gamma: r.gamma,
        l: r.l,
      };
    }
    return undefined;
  }

  private static toEvaluatedCritical(
    c: CoolpropConductivityCriticalJson,
  ): CoolpropConductivityCritical | undefined {
    if (!('type' in c) || c.type !== 'simplified_Olchowy_Sengers') return undefined;
    const R0 = typeof c.R0 === 'number' ? c.R0 : OLCHOWY_SENGERS.R0;
    const gamma = typeof c.gamma === 'number' ? c.gamma : OLCHOWY_SENGERS.GAMMA_EXPONENT;
    const nu = typeof c.nu === 'number' ? c.nu : OLCHOWY_SENGERS.NU;
    const GAMMA = typeof c.GAMMA === 'number' ? c.GAMMA : OLCHOWY_SENGERS.GAMMA;
    const zeta0 = typeof c.zeta0 === 'number' ? c.zeta0 : OLCHOWY_SENGERS.ZETA0_M;
    const qD = typeof c.qD === 'number' ? c.qD : OLCHOWY_SENGERS.QD_PER_M;
    if (![R0, gamma, nu, GAMMA, zeta0, qD].every(Number.isFinite)) return undefined;
    return {
      type: 'simplified_Olchowy_Sengers',
      R0,
      gamma,
      nu,
      GAMMA,
      zeta0,
      qD,
      ...(typeof c.T_ref === 'number' ? { T_ref: c.T_ref } : {}),
    };
  }
}
