import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { kelvinToCelsius } from '../../../common/thermal/utils/temperature';
import { cubicSpline } from '../../../common/utils/interpolation';
import { MetalMaterial } from '../enums/metal-material.enum';
import { MetalLambdaModel } from '../enums/metal-lambda-model.enum';
import { MetalThermalQueryDto } from '../dto/metal-thermal-query.dto';
import { MetalThermalResultDto } from '../dto/metal-thermal-result.dto';
import { MetalSummaryDto } from '../dto/metal-summary.dto';
import { METAL_THERMAL_MAP, METAL_THERMAL_MATERIALS } from '../data/materials/metal-thermal.data';
import { KCT56_CONDUCTIVITY } from '../constants/kct56-conductivity.constants';
import { MetalDataset } from '../utils/metal-dataset';
import { MetalSeriesPoints } from '../utils/metal-series-points';
import { Kct56Conductivity } from '../utils/kct56-conductivity';
import { MetalAlloyRecord } from '../types/metal-alloy-record.type';

const TABLE_PROPS = [
  'thermalConductivity',
  'specificHeat',
  'thermalExpansion',
  'density',
] as const;

/**
 * MetalThermalService
 *
 * Poly λ/ε overrides for `aisi_304` / `mild_steel`, table-driven properties
 * from `shared/processed/metal-data` (cubic splines), plus optional kCT56
 * Chebyshev F(C,T) alternative for carbon steels.
 */
@Injectable()
export class MetalThermalService {

  /** Thermal conductivity λ [W/(m·K)] at T_K [K] (table / poly path). */
  lambda(material: string, T_K: number): number {
    const poly = METAL_THERMAL_MAP.get(material as MetalMaterial);
    if (poly) {
      const { a, b = 0, c = 0, d = 0, tempUnit = 'C' } = poly.lambda;
      const T = tempUnit === 'K' ? T_K : kelvinToCelsius(T_K);
      return a + b * T + c * T * T + d * T * T * T;
    }
    return this.evaluateTableProperty(material, 'thermalConductivity', T_K);
  }

  /**
   * Alternative carbon-steel λ via kCT56 Chebyshev F(C,T).
   * Uses alloy `composition.C` [wt%]; T must lie in [0, 815] °C.
   */
  lambdaKct56(material: string, T_K: number): { lambda: number; C_wtPct: number } {
    const alloy = this.requireAlloy(material);
    const C = alloy.composition?.C;
    if (C === undefined || !Number.isFinite(C)) {
      throw new BadRequestException(
        `kCT56 requires composition.C on material: ${material}`,
      );
    }
    const T_C = kelvinToCelsius(T_K);
    try {
      return { lambda: Kct56Conductivity.evaluate(C, T_C), C_wtPct: C };
    } catch (err) {
      throw new BadRequestException(
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  /** Thermal emissivity ε [−] at T_K [K]. Only poly grades define ε. */
  emissivity(material: string, T_K: number): number {
    const entry = METAL_THERMAL_MAP.get(material as MetalMaterial);
    if (!entry) {
      throw new NotFoundException(
        `Emissivity is not defined for metal material: ${material}`,
      );
    }
    const { a, b, c, d, T_min_K, T_max_K } = entry.emissivity;
    const T = Math.min(Math.max(T_K, T_min_K), T_max_K);
    return a + 1e-5 * b * T + 1e-8 * c * T * T + 1e-10 * d * T * T * T;
  }

  specificHeat(material: string, T_K: number): number {
    return this.evaluateTableProperty(material, 'specificHeat', T_K);
  }

  thermalExpansion(material: string, T_K: number): number {
    return this.evaluateTableProperty(material, 'thermalExpansion', T_K);
  }

  density(material: string, T_K: number): number {
    return this.evaluateTableProperty(material, 'density', T_K);
  }

  /** Catalogue: poly overrides first, then every synthesized alloy. */
  listMaterials(): MetalSummaryDto[] {
    const poly = METAL_THERMAL_MATERIALS.map(entry => ({
      materialId: entry.materialId,
      name: entry.name,
      description: entry.description,
      group: 'steel',
      family: entry.materialId === MetalMaterial.AISI_304 ? 'stainless' : 'carbon',
      availableProperties: ['thermalConductivity', 'emissivity'],
      hasDonorFill: false,
      emissivityRange_K: {
        min: entry.emissivity.T_min_K,
        max: entry.emissivity.T_max_K,
      },
    }));

    const index = MetalDataset.loadIndex();
    const alloys = Object.entries(index.materials).map(([id, meta]) => ({
      materialId: id,
      name: meta.name,
      description: `${meta.group}${meta.family ? ` / ${meta.family}` : ''}`,
      group: meta.group,
      family: meta.family ?? undefined,
      availableProperties: meta.availableProperties,
      hasDonorFill: meta.hasDonorFill,
      emissivityRange_K: undefined,
    }));

    return [...poly, ...alloys];
  }

  getThermalProperties(dto: MetalThermalQueryDto): MetalThermalResultDto {
    const material = dto.material;
    const T_K = dto.T_K;
    const lambdaModel = dto.lambdaModel ?? MetalLambdaModel.TABLE;
    const poly = METAL_THERMAL_MAP.get(material as MetalMaterial);

    if (lambdaModel === MetalLambdaModel.KCT56) {
      if (poly) {
        throw new BadRequestException(
          'kCT56 is not available for poly grades; use a synthesized alloy with composition.C',
        );
      }
      const alloy = this.requireAlloy(material);
      const { lambda, C_wtPct } = this.lambdaKct56(material, T_K);
      const result: MetalThermalResultDto = {
        material,
        T_K,
        lambda_WmK: lambda,
        lambdaModel: MetalLambdaModel.KCT56,
        C_wtPct,
        notes: [KCT56_CONDUCTIVITY.NOTE],
      };
      this.addOptionalTableProps(result, alloy, T_K);
      this.addDonorNotes(result, alloy);
      return result;
    }

    const alloy = poly ? undefined : this.requireAlloy(material);
    const result: MetalThermalResultDto = {
      material,
      T_K,
      lambda_WmK: this.lambda(material, T_K),
      lambdaModel: MetalLambdaModel.TABLE,
    };

    if (poly) {
      result.emissivity = this.emissivity(material, T_K);
    } else if (alloy) {
      this.addOptionalTableProps(result, alloy, T_K);
      this.addDonorNotes(result, alloy);
    }

    return result;
  }

  private addOptionalTableProps(
    result: MetalThermalResultDto,
    alloy: MetalAlloyRecord,
    T_K: number,
  ): void {
    for (const prop of TABLE_PROPS) {
      if (prop === 'thermalConductivity') continue;
      const knots = MetalSeriesPoints.effective(alloy, prop);
      if (!knots.length) continue;
      try {
        const value = this.splineEvaluate(knots, T_K);
        if (prop === 'specificHeat') result.specificHeat_JkgK = value;
        if (prop === 'thermalExpansion') result.thermalExpansion_1e6K = value;
        if (prop === 'density') result.density_kgm3 = value;
      } catch {
        // Property present but T outside range — omit rather than fail the whole response
      }
    }
  }

  private addDonorNotes(result: MetalThermalResultDto, alloy: MetalAlloyRecord): void {
    const donors = alloy.provenance?.donors;
    if (!donors) return;
    result.donors = donors;
    const donorNotes = Object.values(donors)
      .filter(Boolean)
      .map(d => d!.why);
    result.notes = [...(result.notes ?? []), ...donorNotes];
  }

  private evaluateTableProperty(
    material: string,
    prop: string,
    T_K: number,
  ): number {
    const alloy = this.requireAlloy(material);
    const knots = MetalSeriesPoints.effective(alloy, prop);
    if (!knots.length) {
      throw new NotFoundException(
        `Property ${prop} is not available for metal material: ${material}`,
      );
    }
    try {
      return this.splineEvaluate(knots, T_K);
    } catch (err) {
      throw new BadRequestException(
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  private splineEvaluate(
    knots: Array<{ T_K: number; value: number }>,
    T_K: number,
  ): number {
    const xs = knots.map(p => p.T_K);
    const ys = knots.map(p => p.value);
    return cubicSpline(xs, ys).evaluate(T_K);
  }

  private requireAlloy(material: string): MetalAlloyRecord {
    const alloy = MetalDataset.loadAlloy(material);
    if (!alloy) {
      throw new NotFoundException(`Unknown metal material: ${material}`);
    }
    return alloy;
  }
}
