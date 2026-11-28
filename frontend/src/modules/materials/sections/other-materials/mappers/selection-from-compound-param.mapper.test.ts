import { describe, expect, it } from 'vitest';
import { selectionFromCompoundParam } from './selection-from-compound-param.mapper';

describe('other-materials › selection-from-compound-param', () => {
  it('returns null when the query is empty', () => {
    expect(selectionFromCompoundParam(null)).toBeNull();
    expect(selectionFromCompoundParam('')).toBeNull();
  });

  it('builds a catalogue selection from the deep-link id', () => {
    expect(selectionFromCompoundParam('carbon_dioxide')).toEqual({
      source: 'compound',
      id: 'carbon_dioxide',
      label: 'carbon dioxide',
      formula: '',
      displayFormula: '',
      cas: null,
    });
  });
});
