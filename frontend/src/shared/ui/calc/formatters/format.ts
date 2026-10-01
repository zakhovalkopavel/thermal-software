import { formatPowerOfTen } from './format-power-of-ten';

const ENGINEERING_UPPER = 1e6;
const ENGINEERING_LOWER = 1e-3;

export function formatValue(value: number | null | undefined, digits = 4): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  if (value === 0) return '0';

  const abs = Math.abs(value);
  if (abs >= ENGINEERING_UPPER || abs < ENGINEERING_LOWER) {
    let exponent = Math.floor(Math.log10(abs));
    let mantissa = value / 10 ** exponent;
    if (Math.abs(Number(mantissa.toFixed(digits - 1))) >= 10) {
      exponent += 1;
      mantissa /= 10;
    }
    return `${mantissa.toFixed(Math.max(0, digits - 1))}·${formatPowerOfTen(exponent)}`;
  }

  const decimals = Math.max(0, digits - 1 - Math.floor(Math.log10(abs)));
  const fixed = value.toFixed(decimals);
  return fixed.includes('.') ? fixed.replace(/\.?0+$/, '') : fixed;
}
