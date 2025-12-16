/**
 * Phase Diagram Repository
 * Repository pattern for phase diagram data
 */

import { EutecticPoint, PhaseDiagramSystem, OxideComposition } from '../types';

export interface IPhaseDiagramRepository {
  getSystem(systemName: string): PhaseDiagramSystem | null;
  getEutectic(systemName: string, eutecticName: string): EutecticPoint | null;
  listSystems(): string[];
  listEutectics(systemName: string): string[];
}

export class PhaseDiagramRepository implements IPhaseDiagramRepository {
  private static instance: PhaseDiagramRepository;
  private systems: Map<string, PhaseDiagramSystem>;

  private constructor() {
    this.systems = new Map();
    this.initializeData();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): PhaseDiagramRepository {
    if (!PhaseDiagramRepository.instance) {
      PhaseDiagramRepository.instance = new PhaseDiagramRepository();
    }
    return PhaseDiagramRepository.instance;
  }

  /**
   * Initialize phase diagram data
   */
  private initializeData(): void {
    // CaO-Al2O3-SiO2 System
    this.systems.set('CAS', {
      description: 'Calcium Aluminate Silicate ternary system',
      eutectics: {
        anorthite_gehlenite: {
          temperature: 1265,
          composition: {
            CaO: 28.4,
            Al2O3: 36.8,
            SiO2: 34.8
          },
          phases: ['anorthite', 'gehlenite'],
          description: 'Primary eutectic for aluminous refractories'
        },
        anorthite_wollastonite: {
          temperature: 1270,
          composition: {
            CaO: 40.0,
            Al2O3: 25.0,
            SiO2: 35.0
          },
          phases: ['anorthite', 'wollastonite'],
          description: 'High-calcium eutectic'
        },
        mullite_cordierite: {
          temperature: 1345,
          composition: {
            CaO: 5.0,
            Al2O3: 55.0,
            SiO2: 40.0
          },
          phases: ['mullite', 'cordierite'],
          description: 'High-alumina eutectic'
        }
      }
    });

    // MgO-Al2O3-SiO2 System
    this.systems.set('MAS', {
      description: 'Magnesia Alumina Silicate ternary system',
      eutectics: {
        forsterite_spinel: {
          temperature: 1475,
          composition: {
            MgO: 45.0,
            Al2O3: 35.0,
            SiO2: 20.0
          },
          phases: ['forsterite', 'spinel'],
          description: 'Primary eutectic for magnesia refractories'
        },
        forsterite_enstatite: {
          temperature: 1557,
          composition: {
            MgO: 57.8,
            Al2O3: 2.0,
            SiO2: 40.2
          },
          phases: ['forsterite', 'enstatite'],
          description: 'High-magnesia eutectic'
        },
        spinel_corundum: {
          temperature: 1925,
          composition: {
            MgO: 28.0,
            Al2O3: 70.0,
            SiO2: 2.0
          },
          phases: ['spinel', 'corundum'],
          description: 'High-alumina magnesia eutectic'
        }
      }
    });

    // CaO-MgO-SiO2 System
    this.systems.set('CMS', {
      description: 'Calcium Magnesium Silicate ternary system',
      eutectics: {
        diopside_forsterite: {
          temperature: 1387,
          composition: {
            CaO: 25.0,
            MgO: 40.0,
            SiO2: 35.0
          },
          phases: ['diopside', 'forsterite'],
          description: 'Primary eutectic for dolomite refractories'
        },
        wollastonite_diopside: {
          temperature: 1391,
          composition: {
            CaO: 42.0,
            MgO: 15.0,
            SiO2: 43.0
          },
          phases: ['wollastonite', 'diopside'],
          description: 'High-calcium eutectic'
        }
      }
    });

    // Binary SiO2-Al2O3 System
    this.systems.set('SA', {
      description: 'Silica-Alumina binary system',
      eutectics: {
        mullite_cristobalite: {
          temperature: 1587,
          composition: {
            Al2O3: 5.5,
            SiO2: 94.5
          },
          phases: ['mullite', 'cristobalite'],
          description: 'Primary eutectic for high-silica refractories'
        }
      }
    });

    // Binary CaO-SiO2 System
    this.systems.set('CS', {
      description: 'Calcium Silicate binary system',
      eutectics: {
        wollastonite_pseudowollastonite: {
          temperature: 1125,
          composition: {
            CaO: 48.3,
            SiO2: 51.7
          },
          phases: ['wollastonite', 'pseudowollastonite'],
          description: 'Low-temperature calcium silicate eutectic'
        },
        rankinite_pseudowollastonite: {
          temperature: 1464,
          composition: {
            CaO: 63.0,
            SiO2: 37.0
          },
          phases: ['rankinite', 'pseudowollastonite'],
          description: 'High-calcium eutectic'
        }
      }
    });

    // Binary MgO-SiO2 System
    this.systems.set('MS', {
      description: 'Magnesia-Silica binary system',
      eutectics: {
        forsterite_enstatite_binary: {
          temperature: 1557,
          composition: {
            MgO: 57.8,
            SiO2: 42.2
          },
          phases: ['forsterite', 'enstatite'],
          description: 'Mg2SiO4-MgSiO3 eutectic'
        },
        periclase_forsterite: {
          temperature: 1850,
          composition: {
            MgO: 86.0,
            SiO2: 14.0
          },
          phases: ['periclase', 'forsterite'],
          description: 'High-magnesia eutectic'
        }
      }
    });
  }

  /**
   * Get phase diagram system
   */
  public getSystem(systemName: string): PhaseDiagramSystem | null {
    return this.systems.get(systemName) || null;
  }

  /**
   * Get specific eutectic
   */
  public getEutectic(systemName: string, eutecticName: string): EutecticPoint | null {
    const system = this.systems.get(systemName);
    if (!system) return null;
    return system.eutectics[eutecticName] || null;
  }

  /**
   * List all available systems
   */
  public listSystems(): string[] {
    return Array.from(this.systems.keys());
  }

  /**
   * List all eutectics in a system
   */
  public listEutectics(systemName: string): string[] {
    const system = this.systems.get(systemName);
    if (!system) return [];
    return Object.keys(system.eutectics);
  }

  /**
   * Find nearest eutectic based on composition
   */
  public findNearestEutectic(
    systemName: string,
    composition: OxideComposition
  ): { name: string; eutectic: EutecticPoint; distance: number } | null {
    const system = this.systems.get(systemName);
    if (!system) return null;

    let nearest: { name: string; eutectic: EutecticPoint; distance: number } | null = null;
    let minDistance = Infinity;

    for (const [name, eutectic] of Object.entries(system.eutectics)) {
      const distance = this.calculateCompositionDistance(composition, eutectic.composition);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = { name, eutectic, distance };
      }
    }

    return nearest;
  }

  /**
   * Calculate Euclidean distance between two compositions
   */
  private calculateCompositionDistance(
    comp1: OxideComposition,
    comp2: OxideComposition
  ): number {
    const oxides = new Set([...Object.keys(comp1), ...Object.keys(comp2)]);
    let sumSquares = 0;

    for (const oxide of oxides) {
      const val1 = comp1[oxide] || 0;
      const val2 = comp2[oxide] || 0;
      sumSquares += Math.pow(val1 - val2, 2);
    }

    return Math.sqrt(sumSquares);
  }
}

