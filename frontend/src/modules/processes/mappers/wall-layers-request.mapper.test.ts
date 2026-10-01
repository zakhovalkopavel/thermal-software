import { describe, expect, it } from 'vitest';
import { toWallLayers } from './wall-layers-request.mapper';

const LAYER = { id: 'layer-1', material: { kind: 'refractory' as const, materialId: 'chamotte_solid' }, thicknessMm: 230 };

describe('processes › wall-layers-request', () => {
  it('maps drafts to layers in order', () => {
    expect(
      toWallLayers([LAYER, { ...LAYER, id: 'layer-2', material: { kind: 'metal', materialId: 'aisi_304' }, thicknessMm: 5 }]),
    ).toEqual([
      { material: 'chamotte_solid', thicknessMm: 230 },
      { material: 'aisi_304', thicknessMm: 5 },
    ]);
  });

  it('names the layer without material or thickness', () => {
    expect(() => toWallLayers([LAYER, { ...LAYER, material: null }])).toThrow('Wall: choose the material of layer 2.');
    expect(() => toWallLayers([{ ...LAYER, thicknessMm: 0 }], 'Furnace wall')).toThrow(
      'Furnace wall: enter the thickness of layer 1.',
    );
  });
});
