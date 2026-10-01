import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { MixCompositionInputDto } from '../../../../../src/modules/refractory/dto/mix-composition/mix-composition-input.dto';

const VALIDATION_OPTIONS = { whitelist: true, forbidNonWhitelisted: true };

const errorsFor = async (body: unknown) =>
  validate(plainToInstance(MixCompositionInputDto, body), VALIDATION_OPTIONS);

describe('MixCompositionInputDto', () => {
  it('valid fractions - accepted', async () => {
    const body = { fractions: [{ materialId: 'alumina_tabular', massFraction: 0.6 }, { materialId: 'kaolinite', massFraction: 0.4 }] };
    expect(await errorsFor(body)).toHaveLength(0);
  });

  it.each([
    ['empty fractions', { fractions: [] }],
    ['missing fractions', {}],
    ['massFraction below 0', { fractions: [{ materialId: 'kaolinite', massFraction: -0.1 }] }],
    ['massFraction above 1', { fractions: [{ materialId: 'kaolinite', massFraction: 1.1 }] }],
    ['missing materialId', { fractions: [{ massFraction: 0.5 }] }],
    ['empty materialId', { fractions: [{ materialId: '', massFraction: 0.5 }] }],
    ['nested unknown property', { fractions: [{ materialId: 'kaolinite', massFraction: 0.5, sizeClass: 'fine' }] }],
  ])('%s - rejected', async (_case, body) => {
    expect((await errorsFor(body)).length).toBeGreaterThan(0);
  });
});
