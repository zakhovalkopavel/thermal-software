import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { kelvinToCelsius } from '../../../../../src/common/thermal/utils/temperature';
import { MIX_THERMAL_CONSTANTS } from '../../../../../src/modules/refractory/constants/mix-thermal.constants';
import { MixThermalInputDto } from '../../../../../src/modules/refractory/dto/mix-thermal/mix-thermal-input.dto';

const VALIDATION_OPTIONS = { whitelist: true, forbidNonWhitelisted: true };
const MIN_TEMPERATURE_C = kelvinToCelsius(MIX_THERMAL_CONSTANTS.minTemperature_K);

const errorsFor = async (body: unknown) =>
  validate(plainToInstance(MixThermalInputDto, body), VALIDATION_OPTIONS);

const body = (temperatures_C: number[], porosity = 0.2) => ({
  fractions: [{ materialId: 'silicon_carbide', massFraction: 1 }],
  temperatures_C,
  porosity,
});

describe('MixThermalInputDto', () => {
  it('valid request, lowest temperature included - accepted', async () => {
    expect(await errorsFor(body([MIN_TEMPERATURE_C, 20, 1200]))).toHaveLength(0);
  });

  it.each([
    ['no temperatures', body([])],
    ['temperature below the model limit', body([MIN_TEMPERATURE_C - 1, 20])],
    ['absolute zero', body([kelvinToCelsius(0)])],
    ['too many temperatures', body(Array.from({ length: MIX_THERMAL_CONSTANTS.maxTemperatures + 1 }, (_, i) => i))],
    ['porosity below 0', body([20], -0.1)],
    ['porosity above the limit', body([20], MIX_THERMAL_CONSTANTS.porosityMax + 0.01)],
  ])('%s - rejected', async (_case, request) => {
    expect((await errorsFor(request)).length).toBeGreaterThan(0);
  });
});
