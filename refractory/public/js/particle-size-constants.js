/**
 * Particle Size Constants
 * Centralized particle size data to avoid duplication
 * Global variable for browser use
 */

const ParticleSizeConstants = {
  /**
   * Basic particle size classifications (in mm)
   */
  classifications: {
    'extra_coarse': {
      name: 'Extra Coarse (>4 mesh)',
      minSize: 4.75,
      maxSize: 10.0,
      mesh: '> 4 mesh'
    },
    'coarse': {
      name: 'Coarse (4-6 mesh)',
      minSize: 2.36,
      maxSize: 4.75,
      mesh: '4-6 mesh'
    },
    'medium': {
      name: 'Medium (6-30 mesh)',
      minSize: 0.6,
      maxSize: 2.36,
      mesh: '6-30 mesh'
    },
    'fine': {
      name: 'Fine (30-120 mesh)',
      minSize: 0.125,
      maxSize: 0.6,
      mesh: '30-120 mesh'
    },
    'very_fine': {
      name: 'Very Fine (120-400 mesh)',
      minSize: 0.038,
      maxSize: 0.125,
      mesh: '120-400 mesh'
    },
    'ultra_fine': {
      name: 'Ultra Fine (<400 mesh)',
      minSize: 0.001,
      maxSize: 0.038,
      mesh: '< 400 mesh'
    }
  },

  /**
   * ASTM mesh to mm conversion
   */
  meshToMm: {
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
  },

  /**
   * FEPA F series (macrogrits) sizes in mm
   */
  fepaF: {
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
  },

  /**
   * FEPA P series (microgrits) sizes in mm
   */
  fepaP: {
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
  },

  /**
   * Get mesh sizes as array
   */
  getMeshSizes: function() {
    return Object.keys(this.meshToMm).map(Number).sort((a, b) => a - b);
  },

  /**
   * Get FEPA F designations
   */
  getFepaF: function() {
    return Object.keys(this.fepaF);
  },

  /**
   * Get FEPA P designations
   */
  getFepaP: function() {
    return Object.keys(this.fepaP);
  }
};

