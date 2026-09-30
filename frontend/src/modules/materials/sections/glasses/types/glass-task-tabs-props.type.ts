import type { GlassTaskState } from './glass-task-state.type';

export type GlassTaskTabsProps = {
  value: GlassTaskState;
  onChange: (value: GlassTaskState) => void;
};
