/**
 * Volume-fraction helpers for packing models (mass↔volume, size sort).
 */
export class PackingFractions {
  static massToVolumeFractions(mass: number[], densities: number[]): number[] {
    const volumes = mass.map((m, i) => m / densities[i]);
    const sumVolumes = volumes.reduce((s, v) => s + v, 0);
    return volumes.map(v => v / sumVolumes);
  }

  static sortBySize(volumeFractions: number[], diameters: number[]) {
    const indexed = volumeFractions.map((vf, i) => ({ vf, d: diameters[i] }));
    indexed.sort((a, b) => b.d - a.d);
    return { volumeFractions: indexed.map(x => x.vf), diameters: indexed.map(x => x.d) };
  }
}
