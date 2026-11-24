import {
  CompoundData,
  CompoundGasBounds,
} from '../../../../src/common/thermal/utils/compound-data';
import { EquationTypeDto } from '../../../../src/common/thermal/dto/equation-type.dto';

describe('gas temperature bounds', () => {
  it('solves water Tb ≈ 373 K at 101325 Pa from vapour pressure', () => {
    const bounds = CompoundGasBounds.forCompound('water', 101325);
    expect(bounds.boilingPointSource).toBe('vaporPressure');
    expect(bounds.Tmin_K).toBeGreaterThan(370);
    expect(bounds.Tmin_K).toBeLessThan(376);
    expect(bounds.Tmax_K).toBeGreaterThan(bounds.Tmin_K!);
  });

  it('accepts registry keys (N2) for bounds lookup', () => {
    const bounds = CompoundGasBounds.forCompound('N2', 101325);
    expect(bounds.formula).toBe('N2');
    expect(bounds.Tmin_K).toBeGreaterThan(70);
    expect(bounds.Tmin_K).toBeLessThan(90);
  });

  it('binary-searches a vapour-pressure equation for Tb(P)', () => {
    const index = CompoundData.loadIndex();
    const meta = index.compounds['water'] ?? index.compounds[index.byCas!['7732-18-5']];
    const doc = CompoundData.loadFile(meta.file);
    const row = doc.entries[meta.entry].equations!.vaporPressure!.liquid!.values[0];
    const entry = CompoundData.toEquationValue(row);
    expect(entry.type).toBe(EquationTypeDto.wagner25);
    const Tb = CompoundGasBounds.boilingTemperatureFromVaporPressure(entry, 101325);
    expect(Tb).not.toBeNull();
    expect(Tb!).toBeGreaterThan(370);
    expect(Tb!).toBeLessThan(376);
  });
});
