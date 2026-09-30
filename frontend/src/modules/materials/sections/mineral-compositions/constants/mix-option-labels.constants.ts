import type { CementType } from '../types/cement-type.type';
import type { CompactionScenario } from '../types/compaction-scenario.type';
import type { PackingModel } from '../types/packing-model.type';
import type { PsdMethod } from '../types/psd-method.type';
import type { Workability } from '../types/workability.type';

/** Backend enum values with their labels. */
export const MIX_OPTION_LABELS = {
  workability: { firm: 'Firm', standard: 'Standard', flowable: 'Flowable' } satisfies Record<Workability, string>,
  cementType: { CAC: 'Calcium aluminate (CAC)', PC: 'Portland (PC)', generic: 'Generic' } satisfies Record<CementType, string>,
  psdMethod: { Andreasen: 'Andreasen', FunkDinger: 'Funk–Dinger' } satisfies Record<PsdMethod, string>,
  packingModel: { CPM: 'CPM', Furnas: 'Furnas' } satisfies Record<PackingModel, string>,
  scenario: {
    'Self-compacting': 'Self-compacting',
    Flowable: 'Flowable',
    Vibratable: 'Vibratable',
    'Hand-pressable': 'Hand-pressable',
  } satisfies Record<CompactionScenario, string>,
} as const;
