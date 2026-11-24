import type { ASTMC24Result } from './astm-c24-result.type';
import type { ComponentRefractorinesEffect } from './component-refractorines-effect.type';
import type { DutyClassification } from './duty-classification.type';
import type { GOST4069Result } from './gost-4069-result.type';
import type { ISO1893Result } from './iso1893-result.type';
import type { RefractorinessMetadata } from './refractoriness-metadata.type';

/** Single refractoriness calculation result. */
export type RefractorinessResult = {
  /** Calculated refractoriness temperature (°C) — base value */
  estimatedRefractoriness_C: number;

  /** Composition used */
  composition: Record<string, number>;

  /** Component effects breakdown */
  componentEffects: ComponentRefractorinesEffect[];

  /** ISO 1893 result (if requested) */
  iso1893?: ISO1893Result;

  /** ASTM C24 result (if requested) */
  astmC24?: ASTMC24Result;

  /** GOST 4069 result (if requested) */
  gost4069?: GOST4069Result;

  /** Duty class classification */
  dutyClass?: DutyClassification;

  /** Calculation metadata */
  metadata: RefractorinessMetadata;

  /** Warnings or notes */
  warnings: string[];
};
