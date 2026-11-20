import { MetalPropertyDonor } from './metal-property-donor.type';
import { MetalPropertySeries } from './metal-property-series.type';

export type MetalAlloyRecord = {
  materialId: string;
  name: string;
  group: string;
  family: string | null;
  aliases: Record<string, string>;
  composition: Record<string, number>;
  condition: string | null;
  properties: Record<string, MetalPropertySeries>;
  sourceFiles: string[];
  /** Andrews (1965) Ac1 / Ac3 from composition (integer K/°C). */
  criticalTemperatures?: {
    Ac1_K: number;
    Ac3_K: number;
    Ac1_C: number;
    Ac3_C: number;
    method: 'Andrews1965';
    ref: string;
  };
  /** Donor links keyed by property name (not duplicated under each series). */
  provenance?: {
    donors: Record<string, MetalPropertyDonor>;
  };
};
