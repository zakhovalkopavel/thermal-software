import { JanafIndexEntry } from './janaf-index-entry.type';

/** `index.json` */
export type JanafIndexFile = {
  generatedAt: string;
  count: number;
  /** Keyed by table id */
  tables: Record<string, JanafIndexEntry>;
  /** Hill formula (with charge) → table ids of all phases */
  byFormula: Record<string, string[]>;
  /** Element of the JANAF formula → table ids */
  byElement: Record<string, string[]>;
  /** Organic family → table ids */
  byFamily: Record<string, string[]>;
};
