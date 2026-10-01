import { Injectable, NotFoundException } from '@nestjs/common';
import { RefractoryThermalMaterial } from '../../enums/refractory-thermal-material.enum';
import {
  REFRACTORY_THERMAL_MAP,
  REFRACTORY_THERMAL_MATERIALS,
} from '../../data/materials/refractory-thermal.data';
import { RefractoryProductSummaryDto } from '../../dto/refractory-products/refractory-product-summary.dto';
import { RefractoryProductQueryDto } from '../../dto/refractory-products/refractory-product-query.dto';
import { RefractoryProductResultDto } from '../../dto/refractory-products/refractory-product-result.dto';

/**
 * RefractoryThermalService
 *
 * Temperature-dependent thermal conductivity λ(T) and emissivity ε(T) for 19
 * refractory/insulation materials.  All coefficients are stored in
 * `data/materials/refractory-thermal.data.ts` — this service is pure computation.
 *
 * λ(T_C) = a + b·T_C + c·T_C² + d·T_C³  [W/(m·K)],  T_C = T_K − 273
 * ε poly: ε = a + 1e-5·b·T + 1e-8·c·T² + 1e-10·d·T³  (T in Kelvin, clamped)
 * ε exp:  ε = a · T^b                                   (T in Kelvin, clamped)
 *
 * References:
 *   Mikheev M.A. — Osnovy teploperedachi, Energiya 1977, Table A-2
 *   Legacy recuperator.js lines 1850–2035
 */
@Injectable()
export class RefractoryThermalService {

  /** Thermal conductivity λ [W/(m·K)] at temperature T_K [K]. */
  lambda(material: RefractoryThermalMaterial, T_K: number): number {
    const entry = REFRACTORY_THERMAL_MAP.get(material);
    if (!entry) throw new NotFoundException(`Unknown refractory material: ${material}`);

    const t = T_K - 273;
    const { a, b = 0, c = 0, d = 0 } = entry.lambda;
    return a + b * t + c * t * t + d * t * t * t;
  }

  /** Thermal emissivity ε [−] at temperature T_K [K]. T is clamped to valid range. */
  emissivity(material: RefractoryThermalMaterial, T_K: number): number {
    const entry = REFRACTORY_THERMAL_MAP.get(material);
    if (!entry) throw new NotFoundException(`Unknown refractory material: ${material}`);

    const eps = entry.emissivity;
    const T = Math.min(Math.max(T_K, eps.T_min_K), eps.T_max_K);

    if (eps.type === 'exp') {
      return eps.a * Math.pow(T, eps.b);
    }

    return eps.a + 1e-5 * eps.b * T + 1e-8 * eps.c * T * T + 1e-10 * eps.d * T * T * T;
  }

  /** Catalogue of the known refractory and insulation products. */
  listProducts(): RefractoryProductSummaryDto[] {
    return REFRACTORY_THERMAL_MATERIALS.map(entry => ({
      materialId:        entry.materialId,
      name:              entry.name,
      description:       entry.description,
      emissivityRange_K: { min: entry.emissivity.T_min_K, max: entry.emissivity.T_max_K },
    }));
  }

  /** λ and ε of one product at one temperature. */
  getProperties(dto: RefractoryProductQueryDto): RefractoryProductResultDto {
    return {
      material:   dto.material,
      T_K:        dto.T_K,
      lambda_WmK: this.lambda(dto.material, dto.T_K),
      emissivity: this.emissivity(dto.material, dto.T_K),
    };
  }
}
