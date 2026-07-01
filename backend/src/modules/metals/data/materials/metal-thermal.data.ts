/**
 * Metal Thermal Materials
 *
 * Temperature-dependent thermal conductivity λ(T) and emissivity ε(T) for metal
 * materials used in recuperator and furnace wall layer calculations.
 *
 * λ(T) = a + b·T + c·T² + d·T³   [W/(m·K)]
 * ε     = a + 1e-5·b·T_K + 1e-8·c·T_K² + 1e-10·d·T_K³   (T_K clamped)
 *
 * Sources:
 *   AISI 304:   ASM Handbook Vol. 1 (2005), λ fit in Kelvin
 *   Mild steel: Mikheev M.A. — Osnovy teploperedachi, Energiya 1977, Table A-1, λ in Celsius
 *   Emissivity: legacy recuperator.js getEmissivity() lines 1928–1935
 */

import { MetalMaterial } from '../../enums/metal-material.enum';
import { MetalThermalEntry } from '../interfaces/metal-thermal.interface';

export const METAL_THERMAL_MATERIALS: MetalThermalEntry[] = [

  // ── AISI 304 (austenitic stainless steel) ────────────────────────────────
  // λ polynomial uses T in Kelvin (exception — ASM data is tabulated vs T_K)
  {
    materialId:  MetalMaterial.AISI_304,
    name:        'AISI 304 stainless steel',
    description: 'Austenitic 18-8 stainless steel (18% Cr, 8% Ni). λ fit valid 300–1400 K.',
    lambda: {
      tempUnit: 'K',
      a:  9.705,
      b:  1.76e-2,
      c: -1.60e-6,
    },
    emissivity: {
      // Oxidised AISI 304 surface (Incropera 7th ed., App. A)
      a: 0.42, b: 30, c: 0, d: 0,
      T_min_K: 600, T_max_K: 1400,
    },
  },

  // ── Mild steel (low-carbon structural steel) ─────────────────────────────
  // λ polynomial uses T in Celsius (Mikheev 1977 table convention)
  {
    materialId:  MetalMaterial.MILD_STEEL,
    name:        'Mild steel (low-carbon)',
    description: 'Structural/boiler-grade low-carbon steel. λ fit valid 0–800 °C.',
    lambda: {
      tempUnit: 'C',
      a:  49.16,
      b: -8.06e-4,
      c: -8.34e-5,
      d:  6.56e-8,
    },
    emissivity: {
      // Iron-oxide scale surface (legacy recuperator.js line 1931)
      a: 0.173, b: 68.6, c: -25.6, d: 0,
      T_min_K: 100, T_max_K: 1050,
    },
  },

];

/** O(1) lookup by materialId */
export const METAL_THERMAL_MAP = new Map(
  METAL_THERMAL_MATERIALS.map(m => [m.materialId, m]),
);
