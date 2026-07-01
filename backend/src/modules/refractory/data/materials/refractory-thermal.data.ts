/**
 * Refractory Thermal Materials
 *
 * Temperature-dependent thermal conductivity λ(T) and emissivity ε(T) for 19
 * refractory and insulation materials used in recuperator and furnace wall calculations.
 *
 * λ(T_C) = a + b·T_C + c·T_C² + d·T_C³   [W/(m·K)],  T_C in Celsius
 * ε poly: ε = a + 1e-5·b·T + 1e-8·c·T² + 1e-10·d·T³,  T in Kelvin, clamped
 * ε exp:  ε = a · T^b,                                   T in Kelvin, clamped
 *
 * Sources:
 *   Mikheev M.A., Mikheeva I.M. — Osnovy teploperedachi, 2nd ed., Energiya, 1977, Table A-2
 *   Legacy recuperator.js getLambda() lines 1960–2035, getEmissivity() lines 1850–1937
 */

import { RefractoryThermalMaterial } from '../../enums/refractory-thermal-material.enum';
import { RefractoryThermalEntry } from '../interfaces/refractory-thermal.interface';

export const REFRACTORY_THERMAL_MATERIALS: RefractoryThermalEntry[] = [

  // ── Chamotte (aluminosilicate fire brick) ───────────────────────────────────
  // All six variants share the same emissivity polynomial (fire brick medium Al₂O₃)
  {
    materialId: RefractoryThermalMaterial.CHAMOTTE_SOLID,
    name: 'Chamotte solid (dense fire brick)',
    description: 'Dense aluminosilicate fire brick, ρ ≈ 1900–2200 kg/m³',
    lambda:     { a: 0.700, b: 6.40e-4 },
    emissivity: { type: 'poly', a: 0.84, b: -20, c: 0, d: 0, T_min_K: 673, T_max_K: 1673 },
  },
  {
    materialId: RefractoryThermalMaterial.CHAMOTTE_1300,
    name: 'Chamotte 1300 kg/m³',
    description: 'Lightweight chamotte brick, ρ = 1300 kg/m³',
    lambda:     { a: 0.470, b: 3.50e-4 },
    emissivity: { type: 'poly', a: 0.84, b: -20, c: 0, d: 0, T_min_K: 673, T_max_K: 1673 },
  },
  {
    materialId: RefractoryThermalMaterial.CHAMOTTE_1000,
    name: 'Chamotte 1000 kg/m³',
    description: 'Lightweight chamotte brick, ρ = 1000 kg/m³',
    lambda:     { a: 0.350, b: 3.50e-4 },
    emissivity: { type: 'poly', a: 0.84, b: -20, c: 0, d: 0, T_min_K: 673, T_max_K: 1673 },
  },
  {
    materialId: RefractoryThermalMaterial.CHAMOTTE_900,
    name: 'Chamotte 900 kg/m³',
    description: 'Very light chamotte brick, ρ = 900 kg/m³',
    lambda:     { a: 0.290, b: 2.30e-4 },
    emissivity: { type: 'poly', a: 0.84, b: -20, c: 0, d: 0, T_min_K: 673, T_max_K: 1673 },
  },
  {
    materialId: RefractoryThermalMaterial.CHAMOTTE_600,
    name: 'Chamotte 600 kg/m³',
    description: 'Ultra-light chamotte brick, ρ = 600 kg/m³',
    lambda:     { a: 0.130, b: 2.80e-4 },
    emissivity: { type: 'poly', a: 0.84, b: -20, c: 0, d: 0, T_min_K: 673, T_max_K: 1673 },
  },
  {
    materialId: RefractoryThermalMaterial.CHAMOTTE_400,
    name: 'Chamotte 400 kg/m³',
    description: 'Insulating chamotte brick, ρ = 400 kg/m³',
    lambda:     { a: 0.100, b: 2.10e-4 },
    emissivity: { type: 'poly', a: 0.84, b: -20, c: 0, d: 0, T_min_K: 673, T_max_K: 1673 },
  },

  // ── Mullite ─────────────────────────────────────────────────────────────────
  {
    materialId: RefractoryThermalMaterial.MULLITE_2300,
    name: 'Mullite brick 2300 kg/m³',
    description: 'High-alumina mullite (3Al₂O₃·2SiO₂) refractory brick, ρ = 2300 kg/m³',
    lambda:     { a: 1.550, b: 2.00e-4 },
    emissivity: { type: 'exp', a: 26.186, b: -0.555, T_min_K: 600, T_max_K: 2000 },
  },

  // ── Quartz / silica brick ────────────────────────────────────────────────────
  // All quartz variants share emissivity polynomial (low Al₂O₃ fire brick)
  {
    materialId: RefractoryThermalMaterial.QUARTZ_2000,
    name: 'Dense silica brick 2000 kg/m³',
    description: 'Dense fused silica (SiO₂) brick, ρ = 2000 kg/m³',
    lambda:     { a: 0.815, b: 6.70e-4 },
    emissivity: { type: 'poly', a: 0.90, b: -10, c: 0, d: 0, T_min_K: 673, T_max_K: 1673 },
  },
  {
    materialId: RefractoryThermalMaterial.QUARTZ_1000,
    name: 'Quartz 1000 kg/m³',
    description: 'Lightweight silica brick, ρ = 1000 kg/m³',
    lambda:     { a: 0.550, b: 3.00e-4 },
    emissivity: { type: 'poly', a: 0.90, b: -10, c: 0, d: 0, T_min_K: 673, T_max_K: 1673 },
  },
  {
    materialId: RefractoryThermalMaterial.QUARTZ_SAND_1,
    name: 'Quartz sand 1 mm',
    description: 'Granular quartz sand, particle size ~1 mm',
    lambda:     { a: 0.550, b: 3.00e-4 },
    emissivity: { type: 'poly', a: 0.90, b: -10, c: 0, d: 0, T_min_K: 673, T_max_K: 1673 },
  },
  {
    materialId: RefractoryThermalMaterial.QUARTZ_SAND_05,
    name: 'Quartz sand 0.5 mm',
    description: 'Granular quartz sand, particle size ~0.5 mm',
    lambda:     { a: 0.550, b: 3.00e-4 },
    emissivity: { type: 'poly', a: 0.90, b: -10, c: 0, d: 0, T_min_K: 673, T_max_K: 1673 },
  },
  {
    materialId: RefractoryThermalMaterial.QUARTZ_SAND_02,
    name: 'Quartz sand 0.2 mm',
    description: 'Fine quartz sand, particle size ~0.2 mm',
    lambda:     { a: 0.550, b: 3.00e-4 },
    emissivity: { type: 'poly', a: 0.90, b: -10, c: 0, d: 0, T_min_K: 673, T_max_K: 1673 },
  },

  // ── Alumina (Al₂O₃) ─────────────────────────────────────────────────────────
  {
    materialId: RefractoryThermalMaterial.ALUMINA_2500,
    name: 'Dense corundum 2500 kg/m³',
    description: 'Dense fused alumina (α-Al₂O₃) corundum, ρ = 2500 kg/m³',
    lambda:     { a: 1.900, b: 1.60e-3 },
    emissivity: { type: 'poly', a: 0.98, b: -53, c: 10.2, d: 0, T_min_K: 300, T_max_K: 1800 },
  },
  {
    materialId: RefractoryThermalMaterial.ALUMINA_1300,
    name: 'Lightweight alumina 1300 kg/m³',
    description: 'Porous lightweight Al₂O₃ brick, ρ = 1300 kg/m³',
    lambda:     { a: 0.840, b: -3.50e-4 },
    emissivity: { type: 'exp', a: 5.6674, b: -0.3664, T_min_K: 600, T_max_K: 2000 },
  },
  {
    materialId: RefractoryThermalMaterial.ALUMINA_SAND_1,
    name: 'Alumina sand 1 mm',
    description: 'Granular calcined alumina, particle size ~1 mm',
    lambda:     { a: 0.840, b: -3.50e-4 },
    emissivity: { type: 'poly', a: 0.98, b: -53, c: 10.2, d: 0, T_min_K: 300, T_max_K: 1800 },
  },
  {
    materialId: RefractoryThermalMaterial.ALUMINA_SAND_05,
    name: 'Alumina sand 0.5 mm',
    description: 'Granular calcined alumina, particle size ~0.5 mm',
    lambda:     { a: 0.840, b: -3.50e-4 },
    emissivity: { type: 'poly', a: 0.98, b: -53, c: 10.2, d: 0, T_min_K: 300, T_max_K: 1800 },
  },
  {
    materialId: RefractoryThermalMaterial.ALUMINA_SAND_02,
    name: 'Alumina sand 0.2 mm',
    description: 'Fine calcined alumina, particle size ~0.2 mm',
    lambda:     { a: 0.840, b: -3.50e-4 },
    emissivity: { type: 'poly', a: 0.98, b: -53, c: 10.2, d: 0, T_min_K: 300, T_max_K: 1800 },
  },

  // ── Silicon carbide ──────────────────────────────────────────────────────────
  {
    materialId: RefractoryThermalMaterial.SILICON_CARBIDE,
    name: 'Silicon carbide (SiC)',
    description: 'Reaction-bonded or sintered SiC refractory',
    lambda:     { a: 13.73, b: -4.555e-3 },
    emissivity: { type: 'poly', a: 0.8, b: 15.4, c: -9.01, d: 0, T_min_K: 400, T_max_K: 1850 },
  },

  // ── Thermal insulation ───────────────────────────────────────────────────────
  {
    materialId: RefractoryThermalMaterial.BASALT_FIBER_MAT,
    name: 'Basalt fibre mat (LYTX-312)',
    description: 'Needled basalt fibre insulation mat, product LYTX-312',
    lambda:     { a: 0.139, b: -7.97e-5, c: 1.3e-7, d: 2.73e-10 },
    emissivity: { type: 'poly', a: 0.92, b: 0, c: 0, d: 0, T_min_K: 300, T_max_K: 400 },
  },
];

/** O(1) lookup by materialId */
export const REFRACTORY_THERMAL_MAP = new Map(
  REFRACTORY_THERMAL_MATERIALS.map(m => [m.materialId, m]),
);
