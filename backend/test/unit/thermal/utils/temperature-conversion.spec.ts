import { celsiusToKelvin, kelvinToCelsius } from '../../../../src/common/thermal/utils/temperature';

describe('temperature conversion', () => {
  it('celsiusToKelvin', () => {
    expect(celsiusToKelvin(0)).toBe(273.15);
    expect(celsiusToKelvin(-273.15)).toBe(0);
    expect(celsiusToKelvin(1000)).toBeCloseTo(1273.15, 10);
  });

  it('kelvinToCelsius', () => {
    expect(kelvinToCelsius(273.15)).toBe(0);
    expect(kelvinToCelsius(0)).toBe(-273.15);
    expect(kelvinToCelsius(celsiusToKelvin(1234.5))).toBeCloseTo(1234.5, 10);
  });
});
