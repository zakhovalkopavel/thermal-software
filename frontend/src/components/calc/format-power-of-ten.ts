const SUPERSCRIPT_DIGITS: Record<string, string> = {
  '-': '⁻',
  '.': '·',
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
};

export function formatPowerOfTen(exponent: number): string {
  const text = String(Number(exponent.toFixed(2)));
  return `10${[...text].map((char) => SUPERSCRIPT_DIGITS[char] ?? char).join('')}`;
}
