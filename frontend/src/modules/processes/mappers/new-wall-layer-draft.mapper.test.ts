import { describe, expect, it } from 'vitest';
import { toNewWallLayerDraft } from './new-wall-layer-draft.mapper';

describe('processes › new-wall-layer-draft', () => {
  it('creates an empty draft with a unique id', () => {
    const first = toNewWallLayerDraft();
    const second = toNewWallLayerDraft();
    expect(first).toMatchObject({ material: null, thicknessMm: null });
    expect(first.id).toMatch(/^layer-\d+$/);
    expect(second.id).not.toBe(first.id);
  });

  it('copies a layer as a refractory selection by default', () => {
    expect(toNewWallLayerDraft({ material: 'chamotte_solid', thicknessMm: 230 })).toMatchObject({
      material: { kind: 'refractory', materialId: 'chamotte_solid' },
      thicknessMm: 230,
    });
  });

  it('uses the given material kind', () => {
    expect(toNewWallLayerDraft({ material: 'aisi_304', thicknessMm: 5 }, 'metal').material).toEqual({
      kind: 'metal',
      materialId: 'aisi_304',
    });
  });
});
