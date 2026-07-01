import { Injectable, NotFoundException } from '@nestjs/common';
import { MetalMaterial } from '../enums/metal-material.enum';
import { MetalThermalQueryDto } from '../dto/metal-thermal-query.dto';
import { MetalThermalResultDto } from '../dto/metal-thermal-result.dto';
import { METAL_THERMAL_MAP } from '../data/materials/metal-thermal.data';

/**
 * MetalThermalService
 *
 * Temperature-dependent thermal conductivity λ(T) and emissivity ε(T) for metal
 * materials.  All coefficients are stored in
 * `data/materials/metal-thermal.data.ts` — this service is pure computation.
 *
 * λ(T) = a + b·T + c·T² + d·T³   [W/(m·K)]  (T in K or °C per entry)
 * ε    = a + 1e-5·b·T_K + 1e-8·c·T_K² + 1e-10·d·T_K³   (T_K clamped)
 */
@Injectable()
export class MetalThermalService {

  /** Thermal conductivity λ [W/(m·K)] at T_K [K]. */
  lambda(material: MetalMaterial, T_K: number): number {
    const entry = METAL_THERMAL_MAP.get(material);
    if (!entry) throw new NotFoundException(`Unknown metal material: ${material}`);

    const { a, b = 0, c = 0, d = 0, tempUnit = 'C' } = entry.lambda;
    const T = tempUnit === 'K' ? T_K : T_K - 273;
    return a + b * T + c * T * T + d * T * T * T;
  }

  /** Thermal emissivity ε [−] at T_K [K]. T is clamped to valid range. */
  emissivity(material: MetalMaterial, T_K: number): number {
    const entry = METAL_THERMAL_MAP.get(material);
    if (!entry) throw new NotFoundException(`Unknown metal material: ${material}`);

    const { a, b, c, d, T_min_K, T_max_K } = entry.emissivity;
    const T = Math.min(Math.max(T_K, T_min_K), T_max_K);
    return a + 1e-5 * b * T + 1e-8 * c * T * T + 1e-10 * d * T * T * T;
  }

  getThermalProperties(dto: MetalThermalQueryDto): MetalThermalResultDto {
    return {
      material:   dto.material,
      T_K:        dto.T_K,
      lambda_WmK: this.lambda(dto.material, dto.T_K),
      emissivity: this.emissivity(dto.material, dto.T_K),
    };
  }
}
