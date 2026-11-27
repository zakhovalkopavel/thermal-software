import { AmorphousRemainder } from '../../../../src/modules/refractory/utils/amorphous-remainder';

describe('AmorphousRemainder', () => {
  it('leaves impurity oxides as amorphous for tabular alumina mineralogy', () => {
    const result = AmorphousRemainder.of(
      { Al2O3: 99.5, SiO2: 0.1, CaO: 0.1, Fe2O3: 0.1, Na2O: 0.2 },
      {
        phases: [{ phaseId: 'corundum', wt: 99.5 }],
        source: 'test',
      },
    );
    expect(result.amorphous_wt).toBeCloseTo(0.5, 5);
    expect(result.composition.Al2O3).toBeUndefined();
    expect(result.composition.SiO2).toBeCloseTo(0.1, 5);
  });

  it('rejects mineralogy that over-allocates an oxide', () => {
    expect(() =>
      AmorphousRemainder.of(
        { Al2O3: 50, SiO2: 50 },
        { phases: [{ phaseId: 'corundum', wt: 80 }], source: 'bad' },
      ),
    ).toThrow(/over-allocates Al2O3/);
  });
});
