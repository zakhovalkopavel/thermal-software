import { describe, expect, it } from 'vitest';
import { chartFormat } from './chart.format';

describe('charts › chartFormat', () => {
  it('labels log ticks at powers of ten as 10ⁿ and others as values', () => {
    expect([1, 10, 1000, 1e12, 0.01, 3, 50].map(chartFormat.logTick)).toMatchInlineSnapshot(`
      [
        "10⁰",
        "10¹",
        "10³",
        "10¹²",
        "10⁻²",
        "3",
        "50",
      ]
    `);
  });

  it('formats a value with an optional unit', () => {
    expect(chartFormat.value(1743.25, 'K')).toMatchInlineSnapshot(`"1743 K"`);
    expect(chartFormat.value(0.716)).toBe('0.716');
    expect(chartFormat.value(null, 'K')).toBe('— K');
  });

  it('puts the unit of an axis title in brackets', () => {
    expect(chartFormat.axisTitle('Temperature', '°C')).toBe('Temperature [°C]');
    expect(chartFormat.axisTitle('Excess air λ')).toBe('Excess air λ');
  });

  it('renders a coloured marker', () => {
    expect(chartFormat.marker('#1976d2')).toBe('<span style="color:#1976d2">●</span>');
  });
});
