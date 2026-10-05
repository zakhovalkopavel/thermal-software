import { BadRequestException, Injectable } from '@nestjs/common';
import { Air } from '../../../../common/thermal/compound/gas/air';
import { CompoundPropertyResolver } from '../../../../common/thermal/utils/compound-properties';
import { celsiusToKelvin } from '../../../../common/thermal/utils/temperature';
import { MIX_THERMAL_CONSTANTS } from '../../constants/mix-thermal.constants';
import { MaterialEntryDto } from '../../dto/material-catalog/material-entry.dto';
import { MixThermalInputDto } from '../../dto/mix-thermal/mix-thermal-input.dto';
import { MixThermalMaterialDto } from '../../dto/mix-thermal/mix-thermal-material.dto';
import { MixThermalPointDto } from '../../dto/mix-thermal/mix-thermal-point.dto';
import { MixThermalResultDto } from '../../dto/mix-thermal/mix-thermal-result.dto';
import { ConductionLaw } from '../../enums/conduction-law.enum';
import { ThermalReferenceSource } from '../../enums/thermal-reference-source.enum';
import { toFiredPhases } from '../../utils/fired-phases.util';
import { maxwellEuckenConductivity } from '../../utils/maxwell-eucken-conductivity.util';
import { phaseSpecificHeat } from '../../utils/phase-specific-heat.util';
import { MixComponentCatalogService } from '../catalog/mix-component-catalog.service';

const air = new CompoundPropertyResolver(Air);

type MaterialBasis = {
  material: MaterialEntryDto;
  firedMassFraction: number;
  volumeFraction: number;
  phases_wt: Record<string, number>;
  lambdaReference_WmK: number;
  lambdaReferenceSource: ThermalReferenceSource;
  conductionLaw: ConductionLaw;
  /** Library Cp used for the phases without NASA-9 data; undefined → covered phases rescaled */
  specificHeatReference_JkgK?: number;
  heatCapacityCoverage_wt: number;
};

/**
 * MixThermalService
 *
 * Thermal properties of a fired library raw material, or a mix of them, versus
 * temperature: dense solid λ, effective λ at a porosity, Cp, bulk density and
 * diffusivity. All fired phases are kept (SiC, TiN, AlN, C, … are not oxidised).
 * Algorithm: docs/algorithms/MIX_THERMAL_ALGORITHM.md
 */
@Injectable()
export class MixThermalService {
  constructor(private readonly mixComponentCatalog: MixComponentCatalogService) {}

  calculate(dto: MixThermalInputDto): MixThermalResultDto {
    const totalFraction = dto.fractions.reduce((sum, f) => sum + f.massFraction, 0);
    if (totalFraction <= 0) {
      throw new BadRequestException('Sum of massFraction must be greater than 0');
    }

    const raw = dto.fractions.map(f => {
      const material = this.mixComponentCatalog.getMixComponent(f.materialId);
      const { phases_wt, lossOnIgnition_wt } = toFiredPhases(material.composition);
      if (Object.keys(phases_wt).length === 0) {
        throw new BadRequestException(`Material ${f.materialId} has no fired mass`);
      }
      const w = f.massFraction / totalFraction;
      return { material, w, phases_wt, lossOnIgnition_wt, firedMass: w * (100 - lossOnIgnition_wt) };
    });

    const firedTotal = raw.reduce((sum, r) => sum + r.firedMass, 0);
    const specificVolume = raw.reduce(
      (sum, r) => sum + r.firedMass / firedTotal / r.material.rho_true_after_firing_kgm3,
      0,
    );
    const trueDensity_kgm3 = 1 / specificVolume;
    const warnings: string[] = [];

    const bases: MaterialBasis[] = raw.map(r => {
      const firedMassFraction = r.firedMass / firedTotal;
      const reference = this.lambdaReference(r.material);
      if (reference.source === ThermalReferenceSource.GROUP_MEDIAN) {
        warnings.push(
          `${r.material.materialId}: no library λ; the median of its group (${reference.value.toFixed(2)} W/(m·K)) is used.`,
        );
      }
      const specificHeatReference_JkgK = r.material.thermalProperties?.specificHeat_JkgK;
      const heatCapacityCoverage_wt = this.coverage(r.phases_wt);
      if (heatCapacityCoverage_wt <= 0 && specificHeatReference_JkgK === undefined) {
        throw new BadRequestException(`Material ${r.material.materialId} has neither NASA-9 phases nor a library Cp`);
      }
      return {
        material: r.material,
        firedMassFraction,
        volumeFraction: (firedMassFraction / r.material.rho_true_after_firing_kgm3) * trueDensity_kgm3,
        phases_wt: r.phases_wt,
        lambdaReference_WmK: reference.value,
        lambdaReferenceSource: reference.source,
        conductionLaw: this.conductionLaw(r.phases_wt),
        specificHeatReference_JkgK,
        heatCapacityCoverage_wt,
      };
    });

    const firedPhases_wt: Record<string, number> = {};
    for (const basis of bases) {
      for (const [phase, value] of Object.entries(basis.phases_wt)) {
        firedPhases_wt[phase] = (firedPhases_wt[phase] ?? 0) + basis.firedMassFraction * value;
      }
    }
    const heatCapacityCoverage_wt = bases.reduce((sum, b) => sum + b.firedMassFraction * b.heatCapacityCoverage_wt, 0);
    const uncovered = Object.keys(firedPhases_wt).filter(phase => !MIX_THERMAL_CONSTANTS.phaseNasa9Species[phase]);
    if (100 - heatCapacityCoverage_wt > MIX_THERMAL_CONSTANTS.heatCapacityCoverageWarning_wt) {
      warnings.push(
        `No NASA-9 heat capacity for ${uncovered.join(', ')} (${(100 - heatCapacityCoverage_wt).toFixed(1)} % ` +
        `of the fired mass); the library room-temperature Cp of the material is used for that share.`,
      );
    }

    const bulkDensity_kgm3 = trueDensity_kgm3 * (1 - dto.porosity);
    const points = dto.temperatures_C.map(T_C => this.point(bases, T_C, dto.porosity, bulkDensity_kgm3));

    return {
      porosity: dto.porosity,
      lossOnIgnition_wt: round(raw.reduce((sum, r) => sum + r.w * r.lossOnIgnition_wt, 0), 3),
      firedPhases_wt: roundValues(firedPhases_wt, 3),
      heatCapacityCoverage_wt: round(heatCapacityCoverage_wt, 3),
      trueDensity_kgm3: round(trueDensity_kgm3, 1),
      bulkDensity_kgm3: round(bulkDensity_kgm3, 1),
      materials: bases.map(b => this.toMaterialDto(b)),
      points,
      warnings,
    };
  }

  private point(bases: MaterialBasis[], T_C: number, porosity: number, bulkDensity_kgm3: number): MixThermalPointDto {
    const T_K = celsiusToKelvin(T_C);
    const specificHeat = bases.reduce((sum, b) => sum + b.firedMassFraction * this.specificHeat(b, T_K), 0);
    // Lichtenecker: volume-weighted geometric mean of the dense material conductivities
    const lambdaSolid = Math.exp(
      bases.reduce((sum, b) => sum + b.volumeFraction * Math.log(this.solidConductivity(b, T_K)), 0),
    );
    const lambdaEffective = maxwellEuckenConductivity(lambdaSolid, air.thermalConductivity(T_K), porosity);
    return {
      temperature_C: T_C,
      lambdaSolid_WmK: Number(lambdaSolid.toFixed(3)),
      lambdaEffective_WmK: Number(lambdaEffective.toFixed(3)),
      specificHeat_JkgK: Number(specificHeat.toFixed(1)),
      thermalDiffusivity_m2s: Number((lambdaEffective / (bulkDensity_kgm3 * specificHeat)).toExponential(3)),
    };
  }

  /** Neumann–Kopp over the fired phases; phases without NASA-9 data take the library Cp. */
  private specificHeat(basis: MaterialBasis, T_K: number): number {
    let covered = 0;
    let coveredShare = 0;
    for (const [phase, share_wt] of Object.entries(basis.phases_wt)) {
      const cp = phaseSpecificHeat(phase, T_K);
      if (cp === undefined) continue;
      covered += (share_wt / 100) * cp;
      coveredShare += share_wt / 100;
    }
    if (basis.specificHeatReference_JkgK === undefined) return covered / coveredShare;
    return covered + (1 - coveredShare) * basis.specificHeatReference_JkgK;
  }

  private solidConductivity(basis: MaterialBasis, T_K: number): number {
    if (basis.conductionLaw === ConductionLaw.ELECTRONIC) return basis.lambdaReference_WmK;
    const { lambdaAmorphous_WmK: amorphous, referenceTemperature_K } = MIX_THERMAL_CONSTANTS;
    return amorphous + (basis.lambdaReference_WmK - amorphous) * (referenceTemperature_K / T_K);
  }

  private conductionLaw(phases_wt: Record<string, number>): ConductionLaw {
    const [dominant] = Object.entries(phases_wt).sort(([, a], [, b]) => b - a)[0];
    return MIX_THERMAL_CONSTANTS.electronicConductorPhases.includes(dominant)
      ? ConductionLaw.ELECTRONIC
      : ConductionLaw.PHONON;
  }

  private coverage(phases_wt: Record<string, number>): number {
    return Object.entries(phases_wt)
      .filter(([phase]) => MIX_THERMAL_CONSTANTS.phaseNasa9Species[phase])
      .reduce((sum, [, value]) => sum + value, 0);
  }

  private lambdaReference(material: MaterialEntryDto): { value: number; source: ThermalReferenceSource } {
    const own = material.thermalProperties?.thermalConductivity_WmK;
    if (own !== undefined) return { value: own, source: ThermalReferenceSource.LIBRARY };

    const group = material.materialGroup[0];
    const values = (this.mixComponentCatalog.listGroups().find(c => c.group === group)?.materials ?? [])
      .map(m => m.thermalProperties?.thermalConductivity_WmK)
      .filter((v): v is number => v !== undefined)
      .sort((a, b) => a - b);
    if (values.length === 0) {
      throw new BadRequestException(`Material ${material.materialId} has no library λ and no group reference`);
    }
    const mid = Math.floor(values.length / 2);
    const median = values.length % 2 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
    return { value: median, source: ThermalReferenceSource.GROUP_MEDIAN };
  }

  private toMaterialDto(basis: MaterialBasis): MixThermalMaterialDto {
    return {
      materialId: basis.material.materialId,
      firedMassFraction: round(basis.firedMassFraction, 4),
      volumeFraction: round(basis.volumeFraction, 4),
      firedPhases_wt: roundValues(basis.phases_wt, 3),
      trueDensity_kgm3: basis.material.rho_true_after_firing_kgm3,
      lambdaReference_WmK: round(basis.lambdaReference_WmK, 3),
      lambdaReferenceSource: basis.lambdaReferenceSource,
      conductionLaw: basis.conductionLaw,
      heatCapacityCoverage_wt: round(basis.heatCapacityCoverage_wt, 3),
    };
  }
}

function round(value: number, digits: number): number {
  return Number(value.toFixed(digits));
}

function roundValues(values: Record<string, number>, digits: number): Record<string, number> {
  return Object.fromEntries(Object.entries(values).map(([key, value]) => [key, round(value, digits)]));
}
