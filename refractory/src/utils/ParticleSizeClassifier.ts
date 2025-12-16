/**
 * Particle Size Classifier
 * Basic classifications for user-friendly size selection
 */

export class ParticleSizeClassifier {
  /**
   * Basic particle size classifications (in mm)
   * Based on mesh sizes and common refractory practice
   */
  public static readonly classifications = {
    'extra_coarse': {
      name: 'Extra Coarse',
      description: '>4 mesh (>4.75 mm)',
      minSize: 4.75,
      maxSize: 10.0,
      mesh: '> 4 mesh'
    },
    'coarse': {
      name: 'Coarse',
      description: '4-6 mesh (2.36-4.75 mm)',
      minSize: 2.36,
      maxSize: 4.75,
      mesh: '4-6 mesh'
    },
    'medium': {
      name: 'Medium',
      description: '6-30 mesh (0.6-2.36 mm)',
      minSize: 0.6,
      maxSize: 2.36,
      mesh: '6-30 mesh'
    },
    'fine': {
      name: 'Fine',
      description: '30-120 mesh (0.125-0.6 mm)',
      minSize: 0.125,
      maxSize: 0.6,
      mesh: '30-120 mesh'
    },
    'very_fine': {
      name: 'Very Fine',
      description: '120-400 mesh (0.038-0.125 mm)',
      minSize: 0.038,
      maxSize: 0.125,
      mesh: '120-400 mesh'
    },
    'ultra_fine': {
      name: 'Ultra Fine',
      description: '<400 mesh (<0.038 mm)',
      minSize: 0.001,
      maxSize: 0.038,
      mesh: '< 400 mesh'
    }
  };

  /**
   * ASTM mesh to mm conversion (common sizes)
   */
  public static readonly meshToMm = {
    4: 4.75,
    6: 3.35,
    8: 2.36,
    10: 2.0,
    12: 1.7,
    16: 1.18,
    20: 0.85,
    30: 0.6,
    40: 0.425,
    50: 0.3,
    60: 0.25,
    70: 0.212,
    80: 0.18,
    100: 0.15,
    120: 0.125,
    140: 0.106,
    170: 0.09,
    200: 0.075,
    230: 0.063,
    270: 0.053,
    325: 0.045,
    400: 0.038,
    450: 0.032,
    500: 0.025
  };

  /**
   * FEPA F series (macrogrits) - common sizes
   */
  public static readonly fepaF = {
    F4: 4.890,
    F6: 3.460,
    F8: 2.460,
    F10: 2.085,
    F12: 1.765,
    F14: 1.470,
    F16: 1.230,
    F20: 1.040,
    F22: 0.885,
    F24: 0.745,
    F30: 0.625,
    F36: 0.525,
    F40: 0.438,
    F46: 0.370,
    F54: 0.310,
    F60: 0.260,
    F70: 0.218,
    F80: 0.185,
    F90: 0.154,
    F100: 0.129,
    F120: 0.109,
    F150: 0.082,
    F180: 0.069,
    F200: 0.058,
    F220: 0.053
  };

  /**
   * FEPA P series (coated abrasives) - common sizes
   */
  public static readonly fepaP = {
    P12: 1.815,
    P16: 1.324,
    P20: 1.000,
    P24: 0.764,
    P30: 0.642,
    P36: 0.538,
    P40: 0.425,
    P50: 0.336,
    P60: 0.269,
    P80: 0.201,
    P100: 0.162,
    P120: 0.125,
    P150: 0.100,
    P180: 0.082,
    P220: 0.068,
    P240: 0.0585,
    P280: 0.0522,
    P320: 0.0463,
    P360: 0.0403,
    P400: 0.0353,
    P500: 0.0304,
    P600: 0.0260
  };

  /**
   * Get fraction for a classification
   */
  public static getFraction(classification: string): { lowerSize: number; upperSize: number } {
    const cls = this.classifications[classification as keyof typeof this.classifications];
    if (!cls) {
      throw new Error(`Unknown classification: ${classification}`);
    }
    return {
      lowerSize: cls.minSize,
      upperSize: cls.maxSize
    };
  }

  /**
   * Get fraction from mesh range
   */
  public static getFractionFromMesh(lowerMesh: number, upperMesh: number): { lowerSize: number; upperSize: number } {
    const lowerSize = this.meshToMm[upperMesh as keyof typeof this.meshToMm]; // Smaller mesh = larger particles
    const upperSize = this.meshToMm[lowerMesh as keyof typeof this.meshToMm];

    if (!lowerSize || !upperSize) {
      throw new Error(`Invalid mesh sizes: ${lowerMesh}-${upperMesh}`);
    }

    return { lowerSize, upperSize };
  }

  /**
   * Get fraction from FEPA designation
   */
  public static getFractionFromFEPA(designation: string): { lowerSize: number; upperSize: number } {
    let size: number | undefined;

    if (designation.startsWith('F')) {
      size = this.fepaF[designation as keyof typeof this.fepaF];
    } else if (designation.startsWith('P')) {
      size = this.fepaP[designation as keyof typeof this.fepaP];
    }

    if (!size) {
      throw new Error(`Unknown FEPA designation: ${designation}`);
    }

    // Return a narrow range around the designation size (±20%)
    return {
      lowerSize: size * 0.8,
      upperSize: size * 1.2
    };
  }

  /**
   * List all classifications
   */
  public static listClassifications(): Array<{ key: string; name: string; description: string }> {
    return Object.entries(this.classifications).map(([key, value]) => ({
      key,
      name: value.name,
      description: value.description
    }));
  }

  /**
   * List available mesh sizes
   */
  public static listMeshSizes(): number[] {
    return Object.keys(this.meshToMm).map(Number).sort((a, b) => a - b);
  }

  /**
   * List FEPA F series
   */
  public static listFEPA_F(): string[] {
    return Object.keys(this.fepaF);
  }

  /**
   * List FEPA P series
   */
  public static listFEPA_P(): string[] {
    return Object.keys(this.fepaP);
  }
}

