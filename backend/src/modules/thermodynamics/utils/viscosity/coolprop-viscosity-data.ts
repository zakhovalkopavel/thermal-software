import * as fs from 'fs';
import * as path from 'path';
import { CoolpropViscosityDilute } from '../../types/coolprop-viscosity-dilute.type';
import { CoolpropViscosityHigherOrder } from '../../types/coolprop-viscosity-higher-order.type';
import { CoolpropViscosityInitialDensity } from '../../types/coolprop-viscosity-initial-density.type';
import { CoolpropViscosityModel } from '../../types/coolprop-viscosity-model.type';
import { CoolpropHelmholtzData } from '../density/coolprop-helmholtz-data';

/**
 * Cached CoolProp `TRANSPORT.viscosity` models we can evaluate in TypeScript.
 * Skips expression / hardcoded / ECS / friction_theory blocks.
 * Refs: [CoolProp].
 */
export class CoolpropViscosityData {
  private static cache = new Map<string, CoolpropViscosityModel | null>();

  static resetCache(): void {
    CoolpropViscosityData.cache.clear();
  }

  /**
   * First evaluable viscosity model for the fluid, or `null`.
   * When JSON stores a list, skips unsupported entries (e.g. expression).
   */
  static load(coolpropKey: string): CoolpropViscosityModel | null {
    if (CoolpropViscosityData.cache.has(coolpropKey)) {
      return CoolpropViscosityData.cache.get(coolpropKey) ?? null;
    }
    const file = path.join(CoolpropHelmholtzData.dir(), 'fluids', `${coolpropKey}.json`);
    if (!fs.existsSync(file)) {
      CoolpropViscosityData.cache.set(coolpropKey, null);
      return null;
    }
    const doc = JSON.parse(fs.readFileSync(file, 'utf8')) as {
      TRANSPORT?: { viscosity?: unknown };
    };
    const parsed = CoolpropViscosityData.parseViscosity(doc.TRANSPORT?.viscosity);
    CoolpropViscosityData.cache.set(coolpropKey, parsed);
    return parsed;
  }

  private static parseViscosity(raw: unknown): CoolpropViscosityModel | null {
    if (!raw) return null;
    const blocks = Array.isArray(raw) ? raw : [raw];
    for (const block of blocks) {
      const model = CoolpropViscosityData.parseBlock(block);
      if (model) return model;
    }
    return null;
  }

  private static parseBlock(raw: unknown): CoolpropViscosityModel | null {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const row = raw as Record<string, unknown>;
    if (typeof row.hardcoded === 'string') return null;
    if (row.ECS !== undefined || row.Chung !== undefined) return null;

    const dilute = CoolpropViscosityData.parseDilute(row.dilute);
    if (!dilute) return null;

    const epsilon = row.epsilon_over_k;
    const sigma = row.sigma_eta;
    if (typeof epsilon !== 'number' || typeof sigma !== 'number') {
      // powers_of_T / Tr do not need LJ glue; collision_integral does.
      if (dilute.type === 'collision_integral') return null;
    }

    const higherOrder = CoolpropViscosityData.parseHigherOrder(row.higher_order);
    // Hardcoded / expression HO without evaluable residual → not a full dense model.
    if (row.higher_order !== undefined && !higherOrder) return null;

    const initialDensity = CoolpropViscosityData.parseInitialDensity(row.initial_density);
    if (row.initial_density !== undefined && !initialDensity) return null;

    return {
      dilute,
      epsilon_over_k: typeof epsilon === 'number' ? epsilon : 0,
      sigma_eta_m: typeof sigma === 'number' ? sigma : 0,
      ...(initialDensity ? { initialDensity } : {}),
      ...(higherOrder ? { higherOrder } : {}),
    };
  }

  private static parseDilute(raw: unknown): CoolpropViscosityDilute | undefined {
    if (!raw || typeof raw !== 'object') return undefined;
    const d = raw as Record<string, unknown>;
    if (d.type === 'collision_integral') {
      const C = d.C;
      const a = d.a;
      const t = d.t;
      const molar_mass = d.molar_mass;
      if (typeof C !== 'number' || typeof molar_mass !== 'number') return undefined;
      if (!Array.isArray(a) || !Array.isArray(t) || a.length !== t.length) return undefined;
      if (!a.every((x) => typeof x === 'number') || !t.every((x) => typeof x === 'number')) {
        return undefined;
      }
      return { type: 'collision_integral', C, a: a as number[], t: t as number[], molar_mass };
    }
    if (d.type === 'powers_of_T') {
      const a = d.a;
      const t = d.t;
      if (!Array.isArray(a) || !Array.isArray(t) || a.length !== t.length) return undefined;
      if (!a.every((x) => typeof x === 'number') || !t.every((x) => typeof x === 'number')) {
        return undefined;
      }
      return { type: 'powers_of_T', a: a as number[], t: t as number[] };
    }
    if (d.type === 'powers_of_Tr') {
      const T_reducing = d.T_reducing;
      const a = d.a;
      const t = d.t;
      if (typeof T_reducing !== 'number') return undefined;
      if (!Array.isArray(a) || !Array.isArray(t) || a.length !== t.length) return undefined;
      if (!a.every((x) => typeof x === 'number') || !t.every((x) => typeof x === 'number')) {
        return undefined;
      }
      return { type: 'powers_of_Tr', T_reducing, a: a as number[], t: t as number[] };
    }
    return undefined;
  }

  private static parseInitialDensity(raw: unknown): CoolpropViscosityInitialDensity | undefined {
    if (!raw || typeof raw !== 'object') return undefined;
    const d = raw as Record<string, unknown>;
    if (d.type !== 'Rainwater-Friend') return undefined;
    const b = d.b;
    const t = d.t;
    if (!Array.isArray(b) || !Array.isArray(t) || b.length !== t.length) return undefined;
    if (!b.every((x) => typeof x === 'number') || !t.every((x) => typeof x === 'number')) {
      return undefined;
    }
    return { type: 'Rainwater-Friend', b: b as number[], t: t as number[] };
  }

  private static parseHigherOrder(raw: unknown): CoolpropViscosityHigherOrder | undefined {
    if (!raw || typeof raw !== 'object') return undefined;
    const d = raw as Record<string, unknown>;
    if (d.type !== 'modified_Batschinski_Hildebrand') return undefined;
    const T_reduce = d.T_reduce;
    const rhomolar_reduce = d.rhomolar_reduce;
    if (typeof T_reduce !== 'number' || typeof rhomolar_reduce !== 'number') return undefined;
    const need = ['a', 'd1', 't1', 'gamma', 'l', 'f', 'd2', 't2', 'g', 'h', 'p', 'q'] as const;
    const arrays: Record<string, number[]> = {};
    for (const key of need) {
      const v = d[key];
      if (!Array.isArray(v) || !v.every((x) => typeof x === 'number')) return undefined;
      arrays[key] = v as number[];
    }
    if (arrays.a.length !== arrays.d1.length
      || arrays.a.length !== arrays.t1.length
      || arrays.a.length !== arrays.gamma.length
      || arrays.a.length !== arrays.l.length) {
      return undefined;
    }
    return {
      type: 'modified_Batschinski_Hildebrand',
      T_reduce,
      rhomolar_reduce,
      a: arrays.a,
      d1: arrays.d1,
      t1: arrays.t1,
      gamma: arrays.gamma,
      l: arrays.l,
      f: arrays.f,
      d2: arrays.d2,
      t2: arrays.t2,
      g: arrays.g,
      h: arrays.h,
      p: arrays.p,
      q: arrays.q,
    };
  }
}
