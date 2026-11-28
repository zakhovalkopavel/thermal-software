import { describe, expect, it } from 'vitest';
import { selectionFromOption } from './selection-from-option.mapper';
import { toCatalogueCompoundOptions } from './to-catalogue-compound-options.mapper';
import { toRegistryCompoundOptions } from './to-registry-compound-options.mapper';

describe('compound autocomplete options', () => {
  it('maps registry gases', () => {
    const options = toRegistryCompoundOptions([
      { key: 'N2', name: 'Nitrogen', formula: 'N2', Mr_kg_mol: 0.028 },
    ]);
    expect(options[0]).toMatchObject({
      source: 'registry',
      key: 'N2',
      groupLabel: 'Registry',
    });
    expect(selectionFromOption(options[0])).toEqual({
      source: 'registry',
      key: 'N2',
      label: options[0].label,
      formula: 'N2',
    });
  });

  it('maps catalogue hits with CAS · formula secondary text and class group', () => {
    const options = toCatalogueCompoundOptions([
      {
        id: '124-38-9',
        compoundId: 'carbon_dioxide',
        cas: '124-38-9',
        name: 'carbon dioxide',
        formula: 'CO2',
        displayFormula: 'CO2',
        class: 'inorganic',
        group: 'C',
        score: 900,
      },
    ]);
    expect(options[0].secondary).toBe('124-38-9 · CO2 · inorganic · C');
    expect(options[0].groupLabel).toBe('Inorganic');
    expect(selectionFromOption(options[0])).toMatchObject({
      source: 'compound',
      id: 'carbon_dioxide',
      className: 'inorganic',
      group: 'C',
    });
  });
});
