import { describe, expect, it } from 'vitest';
import { BODY_SHAPES } from '../constants/body-shapes.constants';
import { HTC_DEFAULTS } from '../constants/htc-defaults.constants';
import { toBodyGeometryInput } from './body-geometry-request.mapper';

const shape = (value: string) => BODY_SHAPES.find((item) => item.value === value)!;

describe('htc › body-geometry-request', () => {
  it('sends only the dimensions of the shape', () => {
    expect(toBodyGeometryInput(HTC_DEFAULTS.body, shape('cylinder'))).toEqual({
      geometry: 'cylinder',
      dimensions: { a: 0.05, b: 0.2 },
    });
  });

  it('sends the insulation thickness only for shapes that use it', () => {
    const draft = { ...HTC_DEFAULTS.body, dims: { a: 0.1, b: 0.2, c: 0.3 }, h: 0.05 };
    expect(toBodyGeometryInput(draft, shape('sphere'))).toEqual({ geometry: 'sphere', dimensions: { a: 0.1 }, h: 0.05 });
    expect(toBodyGeometryInput(draft, shape('cone'))).not.toHaveProperty('h');
  });

  it('names the missing dimension', () => {
    expect(() => toBodyGeometryInput(HTC_DEFAULTS.body, shape('hollow_cylinder'))).toThrow('Enter Height c.');
  });
});
