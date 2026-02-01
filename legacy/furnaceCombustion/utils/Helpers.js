// Utility helper functions for the combustion model

class Helpers {
  /**
   * Normalize a composition object so that the sum of values equals 1.
   * @param {Object.<string, number>} composition - Map of species to mole fractions or moles.
   * @returns {Object.<string, number>} Normalized composition with sum = 1 (or original if invalid).
   */
  static normalizeComposition(composition) {
    const total = Object.values(composition).reduce((a, b) => a + b, 0);
    if (!total || !isFinite(total)) return composition;
    const out = {};
    for (const [k, v] of Object.entries(composition)) {
      out[k] = v / total;
    }
    return out;
  }

  /**
   * Clamp a numeric value between lower and upper bounds.
   * @param {number} x - Value to clamp [unitless or any].
   * @param {number} min - Lower bound (same units as x).
   * @param {number} max - Upper bound (same units as x).
   * @returns {number} Clamped value.
   */
  static clamp(x, min, max) {
    return Math.min(max, Math.max(min, x));
  }

  /**
   * Linear interpolation between two points (x0, y0) and (x1, y1).
   * @param {number} x0 - First x-coordinate.
   * @param {number} y0 - Function value at x0 (any units).
   * @param {number} x1 - Second x-coordinate.
   * @param {number} y1 - Function value at x1 (same units as y0).
   * @param {number} x - Query x-coordinate.
   * @returns {number} Interpolated y-value at x.
   */
  static lerp(x0, y0, x1, y1, x) {
    if (x1 === x0) return y0;
    const t = (x - x0) / (x1 - x0);
    return y0 + t * (y1 - y0);
  }
}

module.exports = Helpers;
