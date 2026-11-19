import { CoolpropConductivityBlockJson } from '../../types/coolprop-conductivity-block-json.type';
import { CoolpropConductivityCriticalJson } from '../../types/coolprop-conductivity-critical-json.type';
import { CoolpropConductivityDiluteJson } from '../../types/coolprop-conductivity-dilute-json.type';
import { CoolpropConductivityJson } from '../../types/coolprop-conductivity-json.type';
import { CoolpropConductivityResidualJson } from '../../types/coolprop-conductivity-residual-json.type';

/**
 * Runtime narrowers for CoolProp conductivity wire JSON → typed unions.
 * Does not evaluate models; only structural checks.
 */
export class CoolpropConductivityJsonGuard {
  static asJson(raw: unknown): CoolpropConductivityJson | undefined {
    if (Array.isArray(raw)) {
      const blocks: CoolpropConductivityBlockJson[] = [];
      for (const item of raw) {
        const block = CoolpropConductivityJsonGuard.asBlock(item);
        if (!block) return undefined;
        blocks.push(block);
      }
      return blocks;
    }
    return CoolpropConductivityJsonGuard.asBlock(raw);
  }

  static blocks(json: CoolpropConductivityJson): CoolpropConductivityBlockJson[] {
    return Array.isArray(json) ? json : [json];
  }

  static asBlock(raw: unknown): CoolpropConductivityBlockJson | undefined {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
    const row = raw as Record<string, unknown>;
    const block: CoolpropConductivityBlockJson = {};
    if (typeof row.BibTeX === 'string') block.BibTeX = row.BibTeX;
    if (typeof row.note === 'string') block.note = row.note;
    if (typeof row.hardcoded === 'string') block.hardcoded = row.hardcoded;
    // Unknown subsection shapes are omitted (not fatal) so dilute-only fallbacks survive.
    if (row.dilute !== undefined) {
      const dilute = CoolpropConductivityJsonGuard.asDilute(row.dilute);
      if (dilute) block.dilute = dilute;
    }
    if (row.residual !== undefined) {
      const residual = CoolpropConductivityJsonGuard.asResidual(row.residual);
      if (residual) block.residual = residual;
    }
    if (row.critical !== undefined) {
      const critical = CoolpropConductivityJsonGuard.asCritical(row.critical);
      if (critical) block.critical = critical;
    }
    return block;
  }

  static asDilute(raw: unknown): CoolpropConductivityDiluteJson | undefined {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
    const d = raw as Record<string, unknown>;
    if (typeof d.hardcoded === 'string') return { hardcoded: d.hardcoded };
    if (d.type === 'ratio_of_polynomials') {
      if (!CoolpropConductivityJsonGuard.isNumberArray(d.A)
        || !CoolpropConductivityJsonGuard.isNumberArray(d.n)
        || !CoolpropConductivityJsonGuard.isNumberArray(d.B)
        || !CoolpropConductivityJsonGuard.isNumberArray(d.m)
        || typeof d.T_reducing !== 'number') {
        return undefined;
      }
      return {
        type: 'ratio_of_polynomials',
        T_reducing: d.T_reducing,
        A: d.A,
        n: d.n,
        B: d.B,
        m: d.m,
        ...(typeof d.T_reducing_units === 'string'
          ? { T_reducing_units: d.T_reducing_units }
          : {}),
      };
    }
    if (d.type === 'eta0_and_poly') {
      if (!CoolpropConductivityJsonGuard.isNumberArray(d.A)
        || !CoolpropConductivityJsonGuard.isNumberArray(d.t)) {
        return undefined;
      }
      return { type: 'eta0_and_poly', A: d.A, t: d.t };
    }
    if (d.type === 'expression') {
      return {
        type: 'expression',
        ...(typeof d.formula === 'string' ? { formula: d.formula } : {}),
        ...(typeof d.note === 'string' ? { note: d.note } : {}),
      };
    }
    return undefined;
  }

  static asResidual(raw: unknown): CoolpropConductivityResidualJson | undefined {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
    const r = raw as Record<string, unknown>;
    if (r.type === 'polynomial') {
      if (!CoolpropConductivityJsonGuard.isNumberArray(r.B)
        || !CoolpropConductivityJsonGuard.isNumberArray(r.t)
        || !CoolpropConductivityJsonGuard.isNumberArray(r.d)
        || typeof r.T_reducing !== 'number'
        || typeof r.rhomass_reducing !== 'number') {
        return undefined;
      }
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
      if (!CoolpropConductivityJsonGuard.isNumberArray(r.A)
        || !CoolpropConductivityJsonGuard.isNumberArray(r.t)
        || !CoolpropConductivityJsonGuard.isNumberArray(r.d)
        || !CoolpropConductivityJsonGuard.isNumberArray(r.gamma)
        || !CoolpropConductivityJsonGuard.isNumberArray(r.l)) {
        return undefined;
      }
      return {
        type: 'polynomial_and_exponential',
        A: r.A,
        t: r.t,
        d: r.d,
        gamma: r.gamma,
        l: r.l,
      };
    }
    if (r.type === 'expression') {
      return {
        type: 'expression',
        ...(typeof r.formula === 'string' ? { formula: r.formula } : {}),
        ...(typeof r.note === 'string' ? { note: r.note } : {}),
      };
    }
    return undefined;
  }

  static asCritical(raw: unknown): CoolpropConductivityCriticalJson | undefined {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
    const c = raw as Record<string, unknown>;
    if (typeof c.hardcoded === 'string') return { hardcoded: c.hardcoded };
    if (c.type === 'simplified_Olchowy_Sengers') {
      return {
        type: 'simplified_Olchowy_Sengers',
        ...(typeof c.R0 === 'number' ? { R0: c.R0 } : {}),
        ...(typeof c.gamma === 'number' ? { gamma: c.gamma } : {}),
        ...(typeof c.nu === 'number' ? { nu: c.nu } : {}),
        ...(typeof c.GAMMA === 'number' ? { GAMMA: c.GAMMA } : {}),
        ...(typeof c.zeta0 === 'number' ? { zeta0: c.zeta0 } : {}),
        ...(typeof c.qD === 'number' ? { qD: c.qD } : {}),
        ...(typeof c.T_ref === 'number' ? { T_ref: c.T_ref } : {}),
        ...(typeof c.note === 'string' ? { note: c.note } : {}),
      };
    }
    return undefined;
  }

  private static isNumberArray(value: unknown): value is number[] {
    return Array.isArray(value) && value.length > 0 && value.every((x) => typeof x === 'number');
  }
}
