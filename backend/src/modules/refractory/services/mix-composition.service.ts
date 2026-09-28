import { BadRequestException, Injectable } from '@nestjs/common';
import { MIX_COMPOSITION_CONSTANTS } from '../constants/mix-composition.constants';
import { CompositionBasis } from '../enums/composition-basis.enum';
import { MaterialGroup } from '../enums/material-group.enum';
import { NonOxideComponentGroup } from '../enums/non-oxide-component-group.enum';
import { MaterialEntryDto } from '../dto/material-entry.dto';
import { MixCompositionInputDto } from '../dto/mix-composition-input.dto';
import { MixCompositionResultDto } from '../dto/mix-composition-result.dto';
import { NonOxideComponentsDto } from '../dto/non-oxide-components.dto';
import { OxideCompositionDto } from '../dto/common.dto';
import { MixComponentCatalogService } from './mix-component-catalog.service';

type KeyClass =
  | { kind: 'loss' }
  | { kind: 'accepted' }
  | { kind: 'other-oxide' }
  | { kind: 'dropped' }
  | { kind: 'non-oxide'; group: NonOxideComponentGroup };

type RawTotals = {
  loss: number;
  dropped: number;
  accepted: Record<string, number>;
  otherOxides: Record<string, number>;
  nonOxides: Partial<Record<NonOxideComponentGroup, number>>;
};

/**
 * MixCompositionService
 *
 * Chemical composition of a mix of library raw materials on the fired basis:
 * loss on ignition removed, the 8 accepted oxides (also rescaled to 100 %),
 * other oxides, non-oxide components by group, dropped metal impurities and the
 * true density of the fired mix. Algorithm: docs/algorithms/MIX_COMPOSITION_ALGORITHM.md
 */
@Injectable()
export class MixCompositionService {
  constructor(private readonly mixComponentCatalog: MixComponentCatalogService) {}

  calculate(dto: MixCompositionInputDto): MixCompositionResultDto {
    const totalFraction = dto.fractions.reduce((sum, f) => sum + f.massFraction, 0);
    if (totalFraction <= 0) {
      throw new BadRequestException('Sum of massFraction must be greater than 0');
    }

    const components = dto.fractions.map(f => ({
      material: this.mixComponentCatalog.getMixComponent(f.materialId),
      w: f.massFraction / totalFraction,
    }));

    const raw = this.mixRaw(components);
    const firedBase =
      this.sum(raw.accepted) + this.sum(raw.otherOxides) + this.sum(raw.nonOxides);
    if (firedBase <= 0) {
      throw new BadRequestException('The mix has no fired mass');
    }

    const acceptedOxides = this.scale(raw.accepted, 100 / firedBase);
    const otherOxides_wt = this.scale(raw.otherOxides, 100 / firedBase);
    const nonOxides = this.scale(raw.nonOxides, 100 / firedBase);
    const acceptedTotal = this.sum(acceptedOxides);

    return {
      basis: CompositionBasis.FIRED,
      lossOnIgnition_wt: raw.loss,
      acceptedOxides_wt: acceptedOxides as OxideCompositionDto,
      acceptedOxides_normalized:
        acceptedTotal > 0 ? (this.scale(acceptedOxides, 100 / acceptedTotal) as OxideCompositionDto) : {},
      otherOxides_wt,
      nonOxideComponents_wt: nonOxides as NonOxideComponentsDto,
      droppedMetals_wt: (100 * raw.dropped) / firedBase,
      trueDensity_kgm3: this.trueDensity(components),
      warnings: this.warnings(this.sum(otherOxides_wt) + this.sum(nonOxides)),
    };
  }

  /** Σᵢ wᵢ · cᵢ,k per classified key (raw-mix wt%). */
  private mixRaw(components: Array<{ material: MaterialEntryDto; w: number }>): RawTotals {
    const totals: RawTotals = { loss: 0, dropped: 0, accepted: {}, otherOxides: {}, nonOxides: {} };
    for (const { material, w } of components) {
      for (const [key, value] of Object.entries(material.composition)) {
        const share = w * value;
        const keyClass = this.classify(key, value, material.materialGroup[0]);
        switch (keyClass.kind) {
          case 'loss':        totals.loss += share; break;
          case 'dropped':     totals.dropped += share; break;
          case 'accepted':    totals.accepted[key] = (totals.accepted[key] ?? 0) + share; break;
          case 'other-oxide': totals.otherOxides[key] = (totals.otherOxides[key] ?? 0) + share; break;
          case 'non-oxide':
            totals.nonOxides[keyClass.group] = (totals.nonOxides[keyClass.group] ?? 0) + share;
            break;
        }
      }
    }
    return totals;
  }

  /** First matching class wins; see MIX_COMPOSITION_CONSTANTS. */
  private classify(key: string, value_wt: number, primaryGroup: MaterialGroup): KeyClass {
    const c = MIX_COMPOSITION_CONSTANTS;
    if (c.lossOnIgnitionKeys.includes(key)) return { kind: 'loss' };
    if (c.acceptedOxideKeys.includes(key)) return { kind: 'accepted' };
    if (c.oxideKeyPattern.test(key)) return { kind: 'other-oxide' };
    if (c.metalElementKeys.includes(key) && value_wt < c.metalImpurityThreshold_wt) return { kind: 'dropped' };
    if (key === c.carbonKey) return { kind: 'non-oxide', group: NonOxideComponentGroup.CARBON };
    return { kind: 'non-oxide', group: c.nonOxidePrimaryGroups[primaryGroup] ?? NonOxideComponentGroup.OTHER };
  }

  /** 1 / Σᵢ (w′ᵢ / ρᵢ) with fired mass fractions w′ᵢ ∝ wᵢ · (100 − LOIᵢ). */
  private trueDensity(components: Array<{ material: MaterialEntryDto; w: number }>): number {
    const fired = components.map(({ material, w }) => ({
      rho: material.rho_true_after_firing_kgm3,
      mass: w * (100 - this.materialLoss(material)),
    }));
    const firedTotal = fired.reduce((sum, f) => sum + f.mass, 0);
    const specificVolume = fired.reduce((sum, f) => sum + f.mass / firedTotal / f.rho, 0);
    return 1 / specificVolume;
  }

  private materialLoss(material: MaterialEntryDto): number {
    return Object.entries(material.composition)
      .filter(([key]) => MIX_COMPOSITION_CONSTANTS.lossOnIgnitionKeys.includes(key))
      .reduce((sum, [, value]) => sum + value, 0);
  }

  private warnings(outsideAccepted_wt: number): string[] {
    const threshold = MIX_COMPOSITION_CONSTANTS.reliabilityWarningThreshold_wt;
    if (outsideAccepted_wt <= threshold) return [];
    return [
      `Other oxides and non-oxide components are ${outsideAccepted_wt.toFixed(1)} % of the fired mass ` +
      `(> ${threshold} %); chemical analyses use only the 8 accepted oxides and are less reliable.`,
    ];
  }

  private sum(values: Record<string, number | undefined>): number {
    return Object.values(values).reduce<number>((total, v) => total + (v ?? 0), 0);
  }

  private scale(values: Record<string, number | undefined>, factor: number): Record<string, number> {
    return Object.fromEntries(Object.entries(values).map(([k, v]) => [k, (v ?? 0) * factor]));
  }
}
