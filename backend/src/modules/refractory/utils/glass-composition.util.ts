/**
 * Glass Composition Utilities
 *
 * Pure functions for composition normalisation and unit conversion.
 * No NestJS dependencies — usable anywhere (service, utils, tests).
 *
 * Contents:
 *   normalizeComposition — strip zeros, normalise to 100 wt%
 *   wtPctToMolPct        — weight percent → mol percent
 *   molPctToWtPct        — mol percent → weight percent
 */

import { MOLAR_MASSES } from '../constants/viscosity-parameters';

// ─── Normalise ────────────────────────────────────────────────────────────────

/**
 * Normalise a composition object:
 *   1. Remove keys with zero or negative values.
 *   2. Re-scale all values so they sum to exactly 100.
 *
 * This is a no-op for a composition that already sums to 100.
 *
 * @param comp   Raw wt% (or mol%) composition — any number of components.
 * @returns      Cleaned, normalised composition.
 */
export function normalizeComposition(
  comp: Record<string, number>,
): Record<string, number> {
  const filtered: Record<string, number> = {};
  let sum = 0;

  for (const [k, v] of Object.entries(comp)) {
    if (v > 0) {
      filtered[k] = v;
      sum += v;
    }
  }

  if (sum === 0) throw new Error('Composition is empty or all-zero — cannot normalise');

  const factor = 100 / sum;
  const normalized: Record<string, number> = {};
  for (const [k, v] of Object.entries(filtered)) {
    normalized[k] = v * factor;
  }
  return normalized;
}

// ─── wt% → mol% ──────────────────────────────────────────────────────────────

/**
 * Convert weight-percent composition to mol-percent.
 *
 * Algorithm:
 *   n_i = wt_i / M_i       (moles, unnormalised)
 *   mol%_i = n_i / Σ n_j × 100
 *
 * Components not found in MOLAR_MASSES are skipped (treated as zero).
 * The result is normalised to sum to exactly 100.
 *
 * @param wtComp   Composition in wt% (need not sum to 100, will be normalised).
 * @returns        Composition in mol%.
 */
export function wtPctToMolPct(
  wtComp: Record<string, number>,
): Record<string, number> {
  const moles: Record<string, number> = {};
  let totalMoles = 0;

  for (const [k, wt] of Object.entries(wtComp)) {
    if (wt <= 0) continue;
    const M = MOLAR_MASSES[k];
    if (!M) continue; // skip unknown components
    const n = wt / M;
    moles[k] = n;
    totalMoles += n;
  }

  if (totalMoles === 0) return {};

  const molPct: Record<string, number> = {};
  for (const [k, n] of Object.entries(moles)) {
    molPct[k] = (n / totalMoles) * 100;
  }
  return molPct;
}

// ─── mol% → wt% ──────────────────────────────────────────────────────────────

/**
 * Convert mol-percent composition to weight-percent.
 *
 * Algorithm:
 *   mass_i = mol%_i × M_i    (proportional mass)
 *   wt%_i  = mass_i / Σ mass_j × 100
 *
 * Components not found in MOLAR_MASSES are skipped.
 * The result is normalised to sum to exactly 100.
 *
 * @param molComp   Composition in mol% (need not sum to 100).
 * @returns         Composition in wt%.
 */
export function molPctToWtPct(
  molComp: Record<string, number>,
): Record<string, number> {
  const masses: Record<string, number> = {};
  let totalMass = 0;

  for (const [k, mol] of Object.entries(molComp)) {
    if (mol <= 0) continue;
    const M = MOLAR_MASSES[k];
    if (!M) continue;
    const m = mol * M;
    masses[k] = m;
    totalMass += m;
  }

  if (totalMass === 0) return {};

  const wtPct: Record<string, number> = {};
  for (const [k, m] of Object.entries(masses)) {
    wtPct[k] = (m / totalMass) * 100;
  }
  return wtPct;
}

