import type { BodyGeometryDraft } from '../types/body-geometry-draft.type';
import type { HtcDraft } from '../types/htc-draft.type';
import type { VelocitySweepDraft } from '../types/velocity-sweep-draft.type';
import { HTC_UI } from './htc-ui.constants';

const DRAFT: HtcDraft = {
  geometry: 'pipe_circular',
  dims: { a: 0.05 },
  fluidMode: 'mixture',
  fluid: HTC_UI.defaultNamedFluid,
  composition: { N2: 0.72, CO2: 0.12, H2O: 0.1, O2: 0.06 },
  values: { T_fluid_K: 1200, T_surface_K: 800, w_m_s: 5, P_Pa: null, g_m_s2: null },
  forceRegime: '',
  preferredCorrelation: '',
  isHeating: false,
  compareAll: true,
};

const SWEEP: VelocitySweepDraft = {
  from_m_s: HTC_UI.sweep.defaultFrom_m_s,
  to_m_s: HTC_UI.sweep.defaultTo_m_s,
  points: HTC_UI.sweep.defaultPoints,
};

const BODY: BodyGeometryDraft = {
  geometry: 'cylinder',
  dims: { a: 0.05, b: 0.2, c: null },
  h: null,
};

/** Flue gas in a circular pipe (composition of the Swagger example). */
export const HTC_DEFAULTS = { draft: DRAFT, sweep: SWEEP, body: BODY };
