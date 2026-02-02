/**
 * Eutectic Systems Data
 * Static phase diagram data for refractory calculations
 */

export interface EutecticPoint {
  name: string;
  temperature: number; // °C
  composition: {
    [oxide: string]: number; // wt%
  };
  system: string;
  references?: string[];
}

export const EUTECTIC_SYSTEMS = {
  // CAS System (CaO-Al2O3-SiO2)
  CAS: {
    anorthite_gehlenite: {
      name: 'Anorthite-Gehlenite',
      temperature: 1265,
      composition: {
        CaO: 28.4,
        Al2O3: 36.8,
        SiO2: 34.8,
      },
      system: 'CAS',
      references: ['Nurse et al. (1965)', 'Levin et al. (1964)'],
    },
    anorthite_mullite: {
      name: 'Anorthite-Mullite',
      temperature: 1345,
      composition: {
        CaO: 12.8,
        Al2O3: 58.2,
        SiO2: 29.0,
      },
      system: 'CAS',
    },
  },

  // AS System (Al2O3-SiO2)
  AS: {
    mullite_silica: {
      name: 'Mullite-Silica',
      temperature: 1587,
      composition: {
        Al2O3: 71.8,
        SiO2: 28.2,
      },
      system: 'AS',
      references: ['Aksay & Pask (1975)'],
    },
  },

  // MAS System (MgO-Al2O3-SiO2)
  MAS: {
    forsterite_spinel: {
      name: 'Forsterite-Spinel',
      temperature: 1713,
      composition: {
        MgO: 45.2,
        Al2O3: 37.1,
        SiO2: 17.7,
      },
      system: 'MAS',
    },
  },

  // Binary Systems
  BINARY: {
    CaO_Al2O3: {
      name: 'CA (CaO·Al2O3)',
      temperature: 1605,
      composition: {
        CaO: 35.4,
        Al2O3: 64.6,
      },
      system: 'CaO-Al2O3',
    },
    CaO_SiO2: {
      name: 'CS (CaO·SiO2)',
      temperature: 1544,
      composition: {
        CaO: 48.3,
        SiO2: 51.7,
      },
      system: 'CaO-SiO2',
    },
  },
};

/**
 * Get eutectic data by system and name
 */
export function getEutectic(system: string, name: string): EutecticPoint | undefined {
  const systemData = EUTECTIC_SYSTEMS[system as keyof typeof EUTECTIC_SYSTEMS];
  if (!systemData) return undefined;
  return systemData[name as keyof typeof systemData] as EutecticPoint;
}

/**
 * Get all eutectics for a system
 */
export function getSystemEutectics(system: string): Record<string, EutecticPoint> {
  return EUTECTIC_SYSTEMS[system as keyof typeof EUTECTIC_SYSTEMS] || {};
}

/**
 * List all available systems
 */
export function listSystems(): string[] {
  return Object.keys(EUTECTIC_SYSTEMS);
}

