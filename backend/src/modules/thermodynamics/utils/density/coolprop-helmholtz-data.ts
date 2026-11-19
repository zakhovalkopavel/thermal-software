import * as fs from 'fs';
import * as path from 'path';
import { CoolpropAlpha0Term } from '../../types/coolprop-alpha0-term.type';
import { CoolpropBinaryPair } from '../../types/coolprop-binary-pair.type';
import { CoolpropDepartureFunction } from '../../types/coolprop-departure-function.type';
import { CoolpropAlpharTerm } from '../../types/coolprop-alphar-term.type';
import { CoolpropFluidEos } from '../../types/coolprop-fluid-eos.type';

/**
 * Cached loader for vendored CoolProp Helmholtz JSON under `shared/sources/coolprop`.
 * Refs: [CoolProp].
 */
export class CoolpropHelmholtzData {
  private static rootCache: string | undefined;
  private static fluidCache = new Map<string, CoolpropFluidEos>();
  private static pairsCache: CoolpropBinaryPair[] | undefined;
  private static departureCache: Map<string, CoolpropDepartureFunction> | undefined;

  /** Reset caches (tests). */
  static resetCache(): void {
    CoolpropHelmholtzData.rootCache = undefined;
    CoolpropHelmholtzData.fluidCache.clear();
    CoolpropHelmholtzData.pairsCache = undefined;
    CoolpropHelmholtzData.departureCache = undefined;
  }

  static dir(): string {
    if (CoolpropHelmholtzData.rootCache) return CoolpropHelmholtzData.rootCache;
    for (let dir = __dirname; ; dir = path.dirname(dir)) {
      const candidate = path.join(dir, 'shared', 'sources', 'coolprop');
      if (fs.existsSync(path.join(candidate, 'mixture_binary_pairs.json'))) {
        CoolpropHelmholtzData.rootCache = candidate;
        return candidate;
      }
      if (path.dirname(dir) === dir) {
        throw new Error(`CoolProp sources not found above ${__dirname}`);
      }
    }
  }

  static loadFluid(coolpropKey: string): CoolpropFluidEos {
    const cached = CoolpropHelmholtzData.fluidCache.get(coolpropKey);
    if (cached) return cached;
    const file = path.join(CoolpropHelmholtzData.dir(), 'fluids', `${coolpropKey}.json`);
    if (!fs.existsSync(file)) {
      throw new Error(`CoolProp fluid file missing for key "${coolpropKey}"`);
    }
    const doc = JSON.parse(fs.readFileSync(file, 'utf8')) as {
      EOS: Array<{
        STATES: { reducing: { T: number; rhomolar: number; p: number } };
        molar_mass: number;
        alpha0: CoolpropAlpha0Term[];
        alphar: CoolpropAlpharTerm[];
      }>;
    };
    const eos = doc.EOS[0];
    if (!eos) throw new Error(`CoolProp fluid "${coolpropKey}" has no EOS[0]`);
    const parsed: CoolpropFluidEos = {
      Tc: eos.STATES.reducing.T,
      Pc: eos.STATES.reducing.p,
      rhoc: eos.STATES.reducing.rhomolar,
      molarMass: eos.molar_mass,
      alpha0: eos.alpha0 ?? [],
      alphar: eos.alphar,
    };
    CoolpropHelmholtzData.fluidCache.set(coolpropKey, parsed);
    return parsed;
  }

  static loadPairs(): readonly CoolpropBinaryPair[] {
    if (!CoolpropHelmholtzData.pairsCache) {
      CoolpropHelmholtzData.pairsCache = JSON.parse(
        fs.readFileSync(
          path.join(CoolpropHelmholtzData.dir(), 'mixture_binary_pairs.json'),
          'utf8',
        ),
      ) as CoolpropBinaryPair[];
    }
    return CoolpropHelmholtzData.pairsCache;
  }

  static loadDeparture(name: string): CoolpropDepartureFunction | undefined {
    if (!CoolpropHelmholtzData.departureCache) {
      const rows = JSON.parse(
        fs.readFileSync(
          path.join(CoolpropHelmholtzData.dir(), 'mixture_departure_functions.json'),
          'utf8',
        ),
      ) as CoolpropDepartureFunction[];
      CoolpropHelmholtzData.departureCache = new Map();
      for (const row of rows) {
        CoolpropHelmholtzData.departureCache.set(row.Name, row);
        for (const alias of row.aliases ?? []) {
          CoolpropHelmholtzData.departureCache.set(alias, row);
        }
      }
    }
    return CoolpropHelmholtzData.departureCache.get(name);
  }

  static findPair(name1: string, name2: string): CoolpropBinaryPair | undefined {
    for (const row of CoolpropHelmholtzData.loadPairs()) {
      if (
        (row.Name1 === name1 && row.Name2 === name2)
        || (row.Name1 === name2 && row.Name2 === name1)
      ) {
        return row;
      }
    }
    return undefined;
  }
}
