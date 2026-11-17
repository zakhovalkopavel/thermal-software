import { StructureRuleId } from './structure-rule-id.type';

/**
 * Grandfathered structure violations: for each rule, a map of file label → severity count.
 * Counts may only shrink; zero / fixed files must be removed from the baseline.
 */
export type StructureBaseline = Record<StructureRuleId, Record<string, number>>;
