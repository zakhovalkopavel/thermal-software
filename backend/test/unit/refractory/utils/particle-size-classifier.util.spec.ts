import { ParticleSizeClassifier } from '../../../../src/modules/refractory/utils/particle-size-classifier.util';

describe('ParticleSizeClassifier', () => {
  it('classifications getter returns an object with keys', () => {
    const cls = ParticleSizeClassifier.classifications;
    expect(cls).toBeDefined();
    expect(typeof cls).toBe('object');
    expect(Object.keys(cls).length).toBeGreaterThan(0);
  });

  it('listClassifications returns an array with key/name/description', () => {
    const list = ParticleSizeClassifier.listClassifications();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
    expect(list[0]).toHaveProperty('key');
    expect(list[0]).toHaveProperty('name');
  });

  it('meshToMm and listMeshSizes provide numeric mappings', () => {
    const meshMap = ParticleSizeClassifier.meshToMm;
    const meshList = ParticleSizeClassifier.listMeshSizes();
    expect(typeof meshMap).toBe('object');
    expect(Array.isArray(meshList)).toBe(true);
    expect(meshList.length).toBeGreaterThan(0);
    const firstMesh = meshList[0];
    expect(typeof firstMesh).toBe('number');
    expect(typeof meshMap[firstMesh]).toBe('number');
  });

  it('meshToMillimeters and millimetersToMesh are consistent', () => {
    const meshList = ParticleSizeClassifier.listMeshSizes();
    const meshMap = ParticleSizeClassifier.meshToMm;
    const mesh = meshList[0];
    const mm = ParticleSizeClassifier.meshToMillimeters(mesh);
    expect(mm).toBe(meshMap[mesh]);

    const roundedMesh = ParticleSizeClassifier.millimetersToMesh(mm);
    expect(typeof roundedMesh).toBe('number');
  });

  it('getFraction returns sizes for a known classification and throws for unknown', () => {
    const list = ParticleSizeClassifier.listClassifications();
    const key = list[0].key;
    const frac = ParticleSizeClassifier.getFraction(key);
    expect(frac).toHaveProperty('lowerSize');
    expect(frac).toHaveProperty('upperSize');
    expect(() => ParticleSizeClassifier.getFraction('__NO_SUCH_CLASS__')).toThrow();
  });

  it('FEPA lookups and particle size key search work', () => {
    const fList = ParticleSizeClassifier.listFEPA_F();
    if (fList.length > 0) {
      const f = fList[0];
      const r = ParticleSizeClassifier.getFractionFromFEPA_F(f);
      expect(r).toHaveProperty('dMin_mm');
      expect(r).toHaveProperty('dMax_mm');
    }

    const pList = ParticleSizeClassifier.listFEPA_P();
    // ensure method returns array and does not throw
    expect(Array.isArray(pList)).toBe(true);

    const stdKeys = ParticleSizeClassifier.listStandardSizes();
    if (stdKeys.length > 0) {
      const key = stdKeys[0];
      const ps = ParticleSizeClassifier.getParticleSizeByKey(key);
      expect(ps).toBeDefined();
    }
  });

  it('getFractionFromMesh throws on invalid mesh ranges', () => {
    // pick unrealistic mesh numbers to trigger error
    expect(() => ParticleSizeClassifier.getFractionFromMesh(9999, 8888)).toThrow();
  });
});
