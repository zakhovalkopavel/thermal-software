import { describe, expect, it } from 'vitest';
import { buildAxisOptions } from './build-axis-options';

describe('charts › buildAxisOptions', () => {
  it('builds a linear axis with styled plot lines and bands', () => {
    expect(
      buildAxisOptions(
        { title: 'Temperature', unit: '°C', min: 0, max: 1400 },
        [{ value: 1000, label: 'Working point' }],
        [{ from: 0, to: 400, label: 'ε clamped' }],
        'right',
      ),
    ).toMatchInlineSnapshot(`
      {
        "max": 1400,
        "min": 0,
        "opposite": undefined,
        "plotBands": [
          {
            "color": "rgba(25, 118, 210, 0.06)",
            "from": 0,
            "label": {
              "style": {
                "color": "rgba(0, 0, 0, 0.6)",
                "fontSize": "10px",
              },
              "text": "ε clamped",
            },
            "to": 400,
          },
        ],
        "plotLines": [
          {
            "color": "rgba(0, 0, 0, 0.6)",
            "dashStyle": "Dash",
            "label": {
              "align": "right",
              "style": {
                "color": "rgba(0, 0, 0, 0.6)",
                "fontSize": "10px",
              },
              "text": "Working point",
            },
            "value": 1000,
            "width": 1,
            "zIndex": 4,
          },
        ],
        "title": {
          "text": "Temperature [°C]",
        },
        "type": "linear",
      }
    `);
  });

  it('adds minor ticks and a power-of-ten label formatter on a log axis', () => {
    const options = buildAxisOptions({ title: 'Viscosity', unit: 'Pa·s', type: 'logarithmic' });
    expect(options.type).toBe('logarithmic');
    expect(options.minorTickInterval).toBe(0.1);
    const formatter = options.labels?.formatter as unknown as (this: { value: number }) => string;
    expect(formatter.call({ value: 1000 })).toBe('10³');
  });
});
