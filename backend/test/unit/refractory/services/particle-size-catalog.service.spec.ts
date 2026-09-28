import { ParticleSizeCatalogService } from '../../../../src/modules/refractory/services/particle-size-catalog.service';
import { ParticleSizeRangeDto } from '../../../../src/modules/refractory/dto/particle-size-range.dto';

describe('ParticleSizeCatalogService', () => {
  const sizes = new ParticleSizeCatalogService().getParticleSizes();
  const tables: Array<Record<string, ParticleSizeRangeDto>> = Object.values(sizes);

  it('returns the six tables, none empty', () => {
    expect(Object.keys(sizes).sort()).toEqual(['cement', 'classifications', 'fepaF', 'fepaP', 'mesh', 'standard']);
    for (const table of tables) {
      expect(Object.keys(table).length).toBeGreaterThan(0);
    }
  });

  it('every entry has dMin_mm < dMax_mm and d50_mm inside the range', () => {
    for (const table of tables) {
      for (const range of Object.values(table)) {
        expect(range.dMin_mm).toBeLessThan(range.dMax_mm);
        expect(range.d50_mm).toBeGreaterThanOrEqual(range.dMin_mm);
        expect(range.d50_mm).toBeLessThanOrEqual(range.dMax_mm);
      }
    }
  });
});
