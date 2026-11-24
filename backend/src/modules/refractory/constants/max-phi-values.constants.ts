import { MaxPhiModel } from '../enums/max-phi-model.enum';

/**
 * φ_max values by packing model
 * Source: Studart (2006), Wong & Kwan (2008), de Larrard (1999)
 */
export const MAX_PHI_VALUES: Record<MaxPhiModel, number> = {
  [MaxPhiModel.THEORETICAL_FCC]: 0.7405,
  [MaxPhiModel.TYPICAL_CONCRETE]: 0.72,
  [MaxPhiModel.DENSE_CASTABLE]: 0.76,
  [MaxPhiModel.HIGH_PERFORMANCE]: 0.80,
  [MaxPhiModel.LEGACY_CONSERVATIVE]: 0.85,
};
