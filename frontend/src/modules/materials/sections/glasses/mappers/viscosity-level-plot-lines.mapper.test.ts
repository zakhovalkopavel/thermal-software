import { describe, expect, it } from 'vitest';
import { toViscosityLevelPlotLines } from './viscosity-level-plot-lines.mapper';

describe('glasses › viscosity-level-plot-lines', () => {
  it('draws a labelled line per reference viscosity', () => {
    expect(toViscosityLevelPlotLines()).toMatchInlineSnapshot(`
      [
        {
          "label": "Melting 10¹ Pa·s",
          "value": 10,
        },
        {
          "label": "Working 10³ Pa·s",
          "value": 1000,
        },
        {
          "label": "Softening 10⁶·⁶ Pa·s",
          "value": 3981071.7055349695,
        },
        {
          "label": "Annealing 10¹² Pa·s",
          "value": 1000000000000,
        },
        {
          "label": "Strain 10¹³·⁵ Pa·s",
          "value": 31622776601683.793,
        },
      ]
    `);
  });
});
