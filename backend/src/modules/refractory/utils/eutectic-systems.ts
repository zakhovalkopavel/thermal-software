import { EUTECTIC_SYSTEMS } from '../data/eutectic-systems.data';
import type { EutecticSystemPoint } from '../types/eutectic-system-point.type';

/**
 * Lookups over {@link EUTECTIC_SYSTEMS}. Stateless — no DI.
 */
export class EutecticSystems {
  /** Resolve one eutectic by system key and entry name. */
  static get(system: string, name: string): EutecticSystemPoint | undefined {
    const systemData = EUTECTIC_SYSTEMS[system as keyof typeof EUTECTIC_SYSTEMS];
    if (!systemData) return undefined;
    return systemData[name as keyof typeof systemData] as EutecticSystemPoint | undefined;
  }

  /** All eutectics for a system (empty object if unknown). */
  static forSystem(system: string): Record<string, EutecticSystemPoint> {
    return (
      (EUTECTIC_SYSTEMS[system as keyof typeof EUTECTIC_SYSTEMS] as
        | Record<string, EutecticSystemPoint>
        | undefined) ?? {}
    );
  }

  /** Top-level system keys (`CAS`, `AS`, …). */
  static listSystems(): string[] {
    return Object.keys(EUTECTIC_SYSTEMS);
  }
}
