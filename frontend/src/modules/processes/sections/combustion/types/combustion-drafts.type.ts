import type { BedDraft } from './bed-draft.type';
import type { FluidDraft } from './fluid-draft.type';
import type { SolidDirectDraft } from './solid-direct-draft.type';
import type { SolidTwoStepDraft } from './solid-two-step-draft.type';

export type CombustionDrafts = {
  'solid-direct': SolidDirectDraft;
  'solid-two-step': SolidTwoStepDraft;
  fluid: FluidDraft;
  bed: BedDraft;
};
