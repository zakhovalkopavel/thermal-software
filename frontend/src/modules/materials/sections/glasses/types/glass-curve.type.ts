import type { GlassProfileResult } from './glass-profile-result.type';

export type GlassCurve = {
  key: string;
  name: string;
  isUser: boolean;
  profile?: GlassProfileResult;
  error?: unknown;
  /** The requested model was not applied by the backend. */
  swapped: boolean;
};
