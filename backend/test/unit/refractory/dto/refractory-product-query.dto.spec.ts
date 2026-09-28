import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RefractoryProductQueryDto } from '../../../../src/modules/refractory/dto/refractory-product-query.dto';

const VALIDATION_OPTIONS = { whitelist: true, forbidNonWhitelisted: true };

const check = async (query: Record<string, string>) => {
  const dto = plainToInstance(RefractoryProductQueryDto, query);
  return { dto, errors: await validate(dto, VALIDATION_OPTIONS) };
};

describe('RefractoryProductQueryDto', () => {
  it('query-string T_K - converted to a number and accepted', async () => {
    const { dto, errors } = await check({ material: 'chamotte_solid', T_K: '1273' });
    expect(errors).toHaveLength(0);
    expect(dto.T_K).toBe(1273);
  });

  it.each([
    ['missing T_K', { material: 'chamotte_solid' }],
    ['non-numeric T_K', { material: 'chamotte_solid', T_K: 'abc' }],
    ['T_K below 1', { material: 'chamotte_solid', T_K: '0.5' }],
    ['unknown material', { material: 'kaolinite', T_K: '1000' }],
    ['unknown parameter', { material: 'chamotte_solid', T_K: '1000', extra: 'x' }],
  ])('%s - rejected', async (_case, query) => {
    const { errors } = await check(query as Record<string, string>);
    expect(errors.length).toBeGreaterThan(0);
  });
});
