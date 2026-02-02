/**
 * Water Demand Workability Types
 *
 * Defines the available workability levels for water demand calculation
 * Each level determines how much water is needed to achieve desired flowability
 */
export enum WorkabilityType {
  /** Minimum water for workability, vibration-intensive systems */
  FIRM = 'firm',

  /** Balanced flow and strength, typical for most castables (DEFAULT) */
  STANDARD = 'standard',

  /** Maximum water for self-flowing systems, highest mobility */
  FLOWABLE = 'flowable',
}

