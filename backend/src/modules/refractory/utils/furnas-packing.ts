import { BETA0_VALUES } from '../constants/beta0-values.constants';
import { PACKING_DEFAULTS } from '../constants/packing-defaults.constants';
import { PackingFractions } from './packing-fractions';

/**
 * Furnas sequential filling packing model (Furnas 1931).
 * Stateless; used by {@link PackingService.calculateFurnas}.
 */
export class FurnasPacking {
  /**
   * Sequential filling: largest fraction packs first; each smaller fraction fills voids
   * with efficiency × (size_ratio)^0.5.
   */
  static calculate(
    inputs: { massFractions: number[]; densities_kgm3: number[]; diameters_mm: number[] },
    efficiencyFactor?: number,
  ) {
    const { massFractions, densities_kgm3, diameters_mm } = inputs;
    const efficiency = efficiencyFactor ?? PACKING_DEFAULTS.FURNAS_EFFICIENCY;
    const volumeFractions = PackingFractions.massToVolumeFractions(massFractions, densities_kgm3);
    const sorted = PackingFractions.sortBySize(volumeFractions, diameters_mm);

    const beta0 = BETA0_VALUES[PACKING_DEFAULTS.DEFAULT_BETA0_MODEL];

    let totalSolidsVolume = 0;
    let totalVolumeOccupied = 0;
    for (let i = 0; i < sorted.volumeFractions.length; i++) {
      const volFrac = sorted.volumeFractions[i];
      if (i === 0) {
        totalSolidsVolume = volFrac;
        totalVolumeOccupied = volFrac / beta0;
      } else {
        const currentVoidVolume = totalVolumeOccupied - totalSolidsVolume;
        const sizeRatio = sorted.diameters[i] / sorted.diameters[0];
        const adjustedEfficiency = efficiency * Math.pow(sizeRatio, 0.5);
        const fillableVoid = currentVoidVolume * adjustedEfficiency;
        const volumeNeeded = volFrac / beta0;
        totalSolidsVolume += volFrac;
        totalVolumeOccupied += Math.max(0, volumeNeeded - fillableVoid);
      }
    }
    const phi = totalVolumeOccupied > 0 ? totalSolidsVolume / totalVolumeOccupied : 0;
    return {
      model: 'Furnas' as const,
      packingFraction_phi: Number(phi.toFixed(3)),
      porosity_initial: Number((1 - phi).toFixed(3)),
      effectivePackingDensity: phi,
    };
  }
}
