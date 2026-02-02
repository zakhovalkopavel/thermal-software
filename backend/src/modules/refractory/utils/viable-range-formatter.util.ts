/**
 * Viable Range Formatter Utilities
 *
 * Formats viable composition ranges into human-readable strings
 * Example: "[15±1% cement, 40±2% fine, 45±5% coarse] is optimal"
 *
 * Date: February 3, 2026
 */

import { ViableCompositionRange, BlendOptimizationResult } from '../interfaces/blend-optimizer.interface';

/**
 * Format a single component range
 *
 * @param avg - Average mass fraction (%)
 * @param tolerance - Tolerance (±%)
 * @param materialId - Optional material identifier
 * @returns Formatted string like "15±1% cement" or "40±2%"
 */
export function formatComponentRange(
  avg: number,
  tolerance: number,
  materialId?: string
): string {
  const avgRounded = Math.round(avg);
  const toleranceRounded = Math.round(tolerance);

  const baseFormat = `${avgRounded}±${toleranceRounded}%`;

  if (materialId) {
    // Clean up material ID for display
    const displayName = materialId
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
    return `${baseFormat} ${displayName}`;
  }

  return baseFormat;
}

/**
 * Generate summary string for a viable composition range
 *
 * @param range - Viable composition range
 * @param goal - Optimization goal for context
 * @returns Human-readable summary
 *
 * Example outputs:
 * - "[15±1% cement, 40±2% fine, 45±5% coarse] is optimal for maxDensity"
 * - "[15±1%, 40±2%, 45±5%] is optimal"
 */
export function generateRangeSummary(
  range: ViableCompositionRange,
  goal?: string
): string {
  const componentStrings = range.componentRanges.map(comp =>
    formatComponentRange(comp.avg, comp.tolerance, comp.materialId)
  );

  const compositionList = componentStrings.join(', ');
  const goalContext = goal ? ` for ${goal}` : '';

  return `[${compositionList}] is optimal${goalContext}`;
}

/**
 * Calculate tolerance from min/max range
 * Uses half the range as the tolerance
 *
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Tolerance (±)
 */
export function calculateToleranceFromRange(min: number, max: number): number {
  return (max - min) / 2;
}

/**
 * Build viable composition range with formatted output
 *
 * @param formulations - Group of similar formulations
 * @param score - Average score for the group
 * @param tolerances - Per-component tolerances (optional)
 * @param goal - Optimization goal (optional)
 * @returns Complete ViableCompositionRange with formatted strings
 */
export function buildViableRange(
  formulations: BlendOptimizationResult[],
  score: number,
  tolerances?: number[],
  goal?: string
): ViableCompositionRange {
  if (formulations.length === 0) {
    throw new Error('Cannot build viable range from empty formulations array');
  }

  const numComponents = formulations[0].massFractionsRoundedPercent.length;

  // Calculate statistics for each component
  const componentRanges = Array.from({ length: numComponents }, (_, index) => {
    const values = formulations.map(f => f.massFractionsRoundedPercent[index]);

    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;

    // Calculate standard deviation
    const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Use provided tolerance or calculate from range
    const tolerance = tolerances && tolerances[index] !== undefined
      ? tolerances[index]
      : calculateToleranceFromRange(min, max);

    // Try to get material ID from first formulation's fractions
    const materialId = formulations[0].massFractions.length > index
      ? `Component ${index + 1}` // Placeholder, actual materialId should come from fractions
      : undefined;

    const formatted = formatComponentRange(avg, tolerance, materialId);

    return {
      index,
      materialId,
      min,
      max,
      avg,
      stdDev,
      tolerance,
      formatted,
    };
  });

  // Calculate property ranges
  const propertyRanges = {
    density: {
      min: Math.min(...formulations.map(f => f.rhoBulk_gml_green)),
      max: Math.max(...formulations.map(f => f.rhoBulk_gml_green)),
      avg: formulations.reduce((sum, f) => sum + f.rhoBulk_gml_green, 0) / formulations.length,
    },
    porosity: {
      min: Math.min(...formulations.map(f => f.porosity_percent_green)),
      max: Math.max(...formulations.map(f => f.porosity_percent_green)),
      avg: formulations.reduce((sum, f) => sum + f.porosity_percent_green, 0) / formulations.length,
    },
    waterDemand: {
      min: Math.min(...formulations.map(f => f.waterDemand_percent)),
      max: Math.max(...formulations.map(f => f.waterDemand_percent)),
      avg: formulations.reduce((sum, f) => sum + f.waterDemand_percent, 0) / formulations.length,
    },
    packingEfficiency: {
      min: Math.min(...formulations.map(f => f.packingEfficiency)),
      max: Math.max(...formulations.map(f => f.packingEfficiency)),
      avg: formulations.reduce((sum, f) => sum + f.packingEfficiency, 0) / formulations.length,
    },
  };

  const range: ViableCompositionRange = {
    score,
    count: formulations.length,
    formulations,
    componentRanges,
    propertyRanges,
    summary: '', // Will be set below
  };

  // Generate summary
  range.summary = generateRangeSummary(range, goal);

  return range;
}

/**
 * Format multiple viable ranges as a report
 *
 * @param ranges - Array of viable composition ranges
 * @returns Formatted text report
 */
export function formatViableRangesReport(ranges: ViableCompositionRange[]): string {
  if (ranges.length === 0) {
    return 'No viable composition ranges found.';
  }

  const lines: string[] = [
    '═══════════════════════════════════════════',
    'VIABLE COMPOSITION RANGES',
    '═══════════════════════════════════════════',
    '',
  ];

  ranges.forEach((range, index) => {
    lines.push(`Range ${index + 1}: ${range.summary}`);
    lines.push(`  Score: ${range.score.toFixed(2)}`);
    lines.push(`  Formulations: ${range.count}`);
    lines.push('  Components:');

    range.componentRanges.forEach(comp => {
      lines.push(`    - ${comp.formatted} (actual range: ${comp.min}-${comp.max}%)`);
    });

    lines.push('  Properties:');
    lines.push(`    - Density: ${range.propertyRanges.density.min.toFixed(2)}-${range.propertyRanges.density.max.toFixed(2)} g/mL (avg: ${range.propertyRanges.density.avg.toFixed(2)})`);
    lines.push(`    - Porosity: ${range.propertyRanges.porosity.min.toFixed(1)}-${range.propertyRanges.porosity.max.toFixed(1)}% (avg: ${range.propertyRanges.porosity.avg.toFixed(1)}%)`);
    lines.push(`    - Water Demand: ${range.propertyRanges.waterDemand.min.toFixed(1)}-${range.propertyRanges.waterDemand.max.toFixed(1)}% (avg: ${range.propertyRanges.waterDemand.avg.toFixed(1)}%)`);
    lines.push('');
  });

  return lines.join('\n');
}

