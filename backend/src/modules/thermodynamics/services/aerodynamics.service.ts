import { Injectable } from '@nestjs/common';

/**
 * AerodynamicsService — Ergun equation for packed-bed pressure drop.
 * Source: legacy/furnaceCombustion/modules/Aerodynamics.js
 */
@Injectable()
export class AerodynamicsService {

  /**
   * Pressure gradient dP/dz [Pa/m] via Ergun equation.
   * ΔP/L = 150·(1−ε)²·μ·v / (ε³·Dp²) + 1.75·(1−ε)·ρ·v² / (ε³·Dp)
   */
  pressureDrop(params: {
    v_m_s: number;
    D_p_m: number;
    epsilon: number;
    rho_kg_m3: number;
    mu_Pa_s: number;
  }): number {
    const { v_m_s, D_p_m, epsilon, rho_kg_m3, mu_Pa_s } = params;
    const e3 = Math.pow(epsilon, 3);
    const term1 = 150 * Math.pow(1 - epsilon, 2) * mu_Pa_s * v_m_s / (e3 * D_p_m * D_p_m);
    const term2 = 1.75 * (1 - epsilon) * rho_kg_m3 * v_m_s * v_m_s / (e3 * D_p_m);
    return term1 + term2;
  }

  /**
   * Superficial velocity [m/s] from volumetric flow scaled to local T.
   * Source: legacy/furnaceCombustion/modules/Aerodynamics.js
   */
  superficialVelocity(
    massFlow_kg_s: number,
    rho_kg_m3: number,
    area_m2: number,
  ): number {
    return massFlow_kg_s / (rho_kg_m3 * area_m2);
  }
}

