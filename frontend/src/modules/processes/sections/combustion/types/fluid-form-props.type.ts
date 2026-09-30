import type { CombustionFormProps } from './combustion-form-props.type';
import type { FluidDraft } from './fluid-draft.type';

export type FluidFormProps = CombustionFormProps<FluidDraft> & {
  /** Gas species accepted in a custom fuel gas. */
  gasSpecies: string[];
};
