import { EUTECTIC_SYSTEMS } from '../../../../src/modules/refractory/data/eutectic-systems.data';
import { EutecticSystems } from '../../../../src/modules/refractory/utils/eutectic-systems';

describe('EutecticSystems', () => {
  it('resolves CAS anorthite–gehlenite by system and entry key', () => {
    const point = EutecticSystems.get('CAS', 'anorthite_gehlenite');
    expect(point?.temperature).toBe(1265);
    expect(point?.name).toBe('Anorthite-Gehlenite');
    expect(point?.composition.CaO).toBe(28.4);
  });

  it('lists systems matching the dataset keys', () => {
    expect(EutecticSystems.listSystems().sort()).toEqual(
      Object.keys(EUTECTIC_SYSTEMS).sort(),
    );
  });

  it('returns empty map for unknown systems', () => {
    expect(EutecticSystems.forSystem('UNKNOWN')).toEqual({});
    expect(EutecticSystems.get('CAS', 'missing')).toBeUndefined();
  });
});
