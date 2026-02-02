/**
 * Particle Size Classifier Utility
 * Ported from: legacy/refractory/src/utils/ParticleSizeClassifier.ts (229 lines)
 *
 * Provides helper methods for particle size classification, mesh conversions,
 * and FEPA standard lookups.
 *
 * References:
 * - ASTM E11: Standard Specification for Woven Wire Test Sieve Cloth and Test Sieves
 * - FEPA 42-1:2006: Macrogrits F4 to F220
 * - FEPA 43-1:2006: Microgrits F230 to F2000
 * - FEPA 43-2:2006: Grains of Coated Abrasives P12 to P2500
 */

import {
  PARTICLE_SIZE_CLASSIFICATIONS,
  STANDARD_PARTICLE_SIZES,
  CEMENT_PARTICLE_SIZES,
  MESH_PARTICLE_SIZES,
  FEPA_F_SIZES,
  FEPA_P_SIZES,
  ParticleSizeRange,
} from '../data/particle-sizes.data';

export class ParticleSizeClassifier {
  /**
   * Get reference to classifications (from data source)
   */
  public static get classifications() {
    return PARTICLE_SIZE_CLASSIFICATIONS;
  }

  /**
   * ASTM mesh to mm conversion - dynamically generated from MESH_PARTICLE_SIZES
   * Extracts mesh numbers from keys (MESH_4 -> 4, MESH_120 -> 120)
   * and uses d50_mm (median particle size) as the mesh size value
   */
  public static get meshToMm(): Record<number, number> {
    const conversion: Record<number, number> = {};

    // Extract numeric mesh values from MESH_PARTICLE_SIZES keys
    Object.entries(MESH_PARTICLE_SIZES).forEach(([key, value]) => {
      const match = key.match(/^MESH_(\d+)$/);
      if (match) {
        const meshNumber = parseInt(match[1], 10);
        conversion[meshNumber] = value.d50_mm;
      }
    });

    return conversion;
  }

  /**
   * Get fraction for a classification
   */
  public static getFraction(classification: string): { lowerSize: number; upperSize: number } {
    const cls = PARTICLE_SIZE_CLASSIFICATIONS[classification as keyof typeof PARTICLE_SIZE_CLASSIFICATIONS];
    if (!cls) {
      throw new Error(`Unknown classification: ${classification}`);
    }
    return {
      lowerSize: cls.dMin_mm,
      upperSize: cls.dMax_mm,
    };
  }

  /**
   * Get fraction from mesh range
   * Note: Smaller mesh number = larger particles
   */
  public static getFractionFromMesh(
    lowerMesh: number,
    upperMesh: number,
  ): { lowerSize: number; upperSize: number } {
    const lowerSize = this.meshToMm[upperMesh]; // Smaller mesh = larger particles
    const upperSize = this.meshToMm[lowerMesh];

    if (!lowerSize || !upperSize) {
      throw new Error(`Invalid mesh sizes: ${lowerMesh}-${upperMesh}`);
    }

    return { lowerSize, upperSize };
  }

  /**
   * Get fraction from FEPA F series designation
   */
  public static getFractionFromFEPA_F(designation: string): ParticleSizeRange {
    const size = FEPA_F_SIZES[designation];
    if (!size) {
      throw new Error(`Unknown FEPA F designation: ${designation}`);
    }
    return size;
  }

  /**
   * Get fraction from FEPA P series designation
   */
  public static getFractionFromFEPA_P(designation: string): ParticleSizeRange {
    const size = FEPA_P_SIZES[designation];
    if (!size) {
      throw new Error(`Unknown FEPA P designation: ${designation}`);
    }
    return size;
  }

  /**
   * Get particle size by key from any source
   */
  public static getParticleSizeByKey(key: string): ParticleSizeRange | undefined {
    // Check standard sizes first
    if (STANDARD_PARTICLE_SIZES[key]) {
      return STANDARD_PARTICLE_SIZES[key];
    }

    // Check cement sizes
    if (CEMENT_PARTICLE_SIZES[key]) {
      return CEMENT_PARTICLE_SIZES[key];
    }

    // Check mesh sizes
    if (MESH_PARTICLE_SIZES[key]) {
      return MESH_PARTICLE_SIZES[key];
    }

    // Check FEPA F
    if (FEPA_F_SIZES[key]) {
      return FEPA_F_SIZES[key];
    }

    // Check FEPA P
    if (FEPA_P_SIZES[key]) {
      return FEPA_P_SIZES[key];
    }

    return undefined;
  }

  /**
   * List all classifications
   */
  public static listClassifications(): Array<{ key: string; name: string; description: string }> {
    return Object.entries(PARTICLE_SIZE_CLASSIFICATIONS).map(([key, value]) => ({
      key,
      name: value.name || value.grade,
      description: value.description || `${value.dMin_mm}-${value.dMax_mm} mm`,
    }));
  }

  /**
   * List available mesh sizes
   */
  public static listMeshSizes(): number[] {
    return Object.keys(this.meshToMm)
      .map(Number)
      .sort((a, b) => a - b);
  }

  /**
   * List FEPA F series designations
   */
  public static listFEPA_F(): string[] {
    return Object.keys(FEPA_F_SIZES);
  }

  /**
   * List FEPA P series designations
   */
  public static listFEPA_P(): string[] {
    return Object.keys(FEPA_P_SIZES);
  }

  /**
   * List all standard particle size keys
   */
  public static listStandardSizes(): string[] {
    return Object.keys(STANDARD_PARTICLE_SIZES);
  }

  /**
   * List all mesh-based particle size keys
   */
  public static listMeshSizes_Keys(): string[] {
    return Object.keys(MESH_PARTICLE_SIZES);
  }

  /**
   * Convert mesh number to mm
   */
  public static meshToMillimeters(mesh: number): number | undefined {
    return this.meshToMm[mesh];
  }

  /**
   * Find closest mesh number for a given size in mm
   */
  public static millimetersToMesh(sizeInMm: number): number {
    let closestMesh = 4;
    let minDiff = Math.abs(this.meshToMm[4] - sizeInMm);

    for (const [mesh, size] of Object.entries(this.meshToMm)) {
      const diff = Math.abs(size - sizeInMm);
      if (diff < minDiff) {
        minDiff = diff;
        closestMesh = Number(mesh);
      }
    }

    return closestMesh;
  }
}

