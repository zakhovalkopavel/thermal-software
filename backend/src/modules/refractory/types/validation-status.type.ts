import type { ConfidenceLevel, ExtrapolationRisk } from '../enums';
import type { CompositionIssue } from './composition-issue.type';

/** Composition validation status. */
export type ValidationStatus = {
  /** Detected system description */
  systemDetected: string;

  /** Overall confidence level */
  confidenceLevel: ConfidenceLevel;

  /** Warnings about composition */
  warnings: string[];

  /** Number of components within validated ranges */
  componentsInRange: number;

  /** Number of components outside validated ranges */
  componentsOutOfRange: number;

  /** Risk level for extrapolation */
  extrapolationRisk: ExtrapolationRisk;

  /** Specific composition issues */
  compositionIssues?: CompositionIssue[];
};
