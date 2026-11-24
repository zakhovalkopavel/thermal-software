import {
  CompoundSearch,
  CompoundText,
} from '../../../../src/common/thermal/utils/compound-data';

describe('compound search', () => {
  it('ranks exact CAS above name substring', () => {
    const hits = CompoundSearch.search('124-38-9', { limit: 5 });
    expect(hits[0]?.compoundId).toBe('carbon_dioxide');
    expect(hits[0]?.cas).toBe('124-38-9');
    expect(hits[0]?.score).toBeGreaterThanOrEqual(1000);
  });

  it('finds CO2 by formula including unicode subscript', () => {
    expect(CompoundText.normalizeFormula('CO₂')).toBe('CO2');
    const hits = CompoundSearch.search('CO₂', { limit: 5, gasesOnly: true });
    expect(hits.some((hit) => hit.formula === 'CO2' || hit.displayFormula === 'CO2')).toBe(true);
    expect(hits[0]?.score).toBeGreaterThanOrEqual(900);
  });

  it('finds water by synonym', () => {
    const hits = CompoundSearch.search('dihydrogen oxide', { limit: 5 });
    expect(hits.some((hit) => hit.compoundId === 'water' || hit.formula === 'H2O')).toBe(true);
  });

  it('finds nitrogen by preferred name', () => {
    const hits = CompoundSearch.search('nitrogen', { limit: 10, gasesOnly: true });
    expect(hits.some((hit) => hit.formula === 'N2')).toBe(true);
  });

  it('returns an empty list for a blank query', () => {
    expect(CompoundSearch.search('   ')).toEqual([]);
  });
});
