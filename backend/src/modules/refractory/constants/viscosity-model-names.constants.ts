import { ViscosityModel } from '../enums/viscosity-model.enum';

/** Display names for {@link ViscosityModel} values (API / reports). */
export const VISCOSITY_MODEL_NAMES: Record<ViscosityModel, string> = {
  [ViscosityModel.LAKATOS_1976]:      'Soda-Lime-Silica / Near-Variants (Lakatos 1976)',
  [ViscosityModel.FLUEGEL_2007]:      'Broad Silicate Glass incl. low-F oxide-fluoride (Fluegel 2007)',
  [ViscosityModel.HETHERINGTON_1964]: 'Pure Fused Silica (Hetherington 1964)',
  [ViscosityModel.IIDA]:              'Industrial Mixed Slag — Iida Model (Iida & Guthrie 1988 / Mills 2011)',
  [ViscosityModel.NAKAMOTO_2007]:     'Fluoride-Bearing Slag — Nakamoto 2007 (ISIJ Int. 47:1583)',
  [ViscosityModel.NOT_SUPPORTED]:     'Not Supported — no valid published model',
};
