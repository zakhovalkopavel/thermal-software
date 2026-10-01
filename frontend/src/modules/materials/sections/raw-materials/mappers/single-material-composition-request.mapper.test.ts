import { describe, expect, it } from 'vitest';
import { toSingleMaterialCompositionRequest } from './single-material-composition-request.mapper';

describe('raw-materials › single-material-composition-request', () => {
  it('requests the material as the whole mix', () => {
    expect(toSingleMaterialCompositionRequest('kaolin')).toEqual({ fractions: [{ materialId: 'kaolin', massFraction: 1 }] });
  });
});
