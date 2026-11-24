import { COMPONENT_PROPERTIES } from '../../../../src/modules/refractory/data/component-properties.data';
import { ComponentProperties } from '../../../../src/modules/refractory/utils/component-properties';

describe('component-properties registry', () => {
  it('indexes every component by chemical formula (SiO2, not SIO2)', () => {
    expect(COMPONENT_PROPERTIES.SiO2?.formula).toBe('SiO2');
    expect(COMPONENT_PROPERTIES.Al2O3?.formula).toBe('Al2O3');
    expect(COMPONENT_PROPERTIES.CaF2?.formula).toBe('CaF2');
    expect(COMPONENT_PROPERTIES.NaCl?.formula).toBe('NaCl');
    expect(COMPONENT_PROPERTIES.SIO2).toBeUndefined();
    expect(ComponentProperties.formulas()).toEqual(
      expect.arrayContaining(['SiO2', 'Al2O3', 'Na2O', 'CaF2', 'NaCl']),
    );
    expect(ComponentProperties.formulas()).toHaveLength(33);
  });

  it('ComponentProperties.get resolves API / DTO formula keys', () => {
    expect(ComponentProperties.get('SiO2')?.refractorinessEffect).toBe(
      COMPONENT_PROPERTIES.SiO2.refractorinessEffect,
    );
    expect(ComponentProperties.get('Na2O')?.refractorinessEffect).toBeLessThan(0);
    expect(ComponentProperties.get('unknown')).toBeUndefined();
  });

  it('applies refractoriness and conductivity effects for mixed-case compositions', () => {
    const alumina = ComponentProperties.refractorinessEffect({ Al2O3: 100 });
    const flux = ComponentProperties.refractorinessEffect({ Na2O: 100 });
    expect(alumina).toBeGreaterThan(0);
    expect(flux).toBeLessThan(0);

    const kSi = ComponentProperties.weightedThermalConductivity({ SiO2: 100 });
    const kMg = ComponentProperties.weightedThermalConductivity({ MgO: 100 });
    expect(kSi).not.toBe(kMg);
    expect(kSi).toBe(COMPONENT_PROPERTIES.SiO2.conductivity_WmK);
  });

  it('extractByCategory buckets by formula keys from the input', () => {
    const cats = ComponentProperties.extractByCategory({
      SiO2: 40,
      Al2O3: 40,
      CaF2: 10,
      NaCl: 10,
    });
    expect(cats.oxideFormers).toEqual(expect.objectContaining({ SiO2: 40, Al2O3: 40 }));
    expect(cats.fluorides).toEqual({ CaF2: 10 });
    expect(cats.chlorides).toEqual({ NaCl: 10 });
  });
});
