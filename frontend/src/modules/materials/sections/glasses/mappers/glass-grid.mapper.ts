import { toCelsiusGrid } from '../../../mappers/celsius-grid.mapper';
import { GLASSES_UI } from '../constants/glasses-ui.constants';

/** °C grid from / to / step, both ends included. Throws a user-facing message when invalid. */
export function toGlassGrid(from: number | null, to: number | null, step: number | null): number[] {
  return toCelsiusGrid(from, to, step, GLASSES_UI.maxGridPoints);
}
