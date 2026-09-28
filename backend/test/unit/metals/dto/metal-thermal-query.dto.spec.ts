import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { MetalThermalQueryDto } from '../../../../src/modules/metals/dto/metal-thermal-query.dto';

const VALIDATION_OPTIONS = { whitelist: true, forbidNonWhitelisted: true };

const check = async (query: Record<string, string>) => {
  const dto = plainToInstance(MetalThermalQueryDto, query);
  return { dto, errors: await validate(dto, VALIDATION_OPTIONS) };
};

describe('MetalThermalQueryDto', () => {
  it('query-string T_K - converted to a number and accepted', async () => {
    const { dto, errors } = await check({ material: 'aisi_304', T_K: '800' });
    expect(errors).toHaveLength(0);
    expect(dto.T_K).toBe(800);
  });

  it.each([
    ['missing T_K', { material: 'aisi_304' }],
    ['non-numeric T_K', { material: 'aisi_304', T_K: 'hot' }],
    ['T_K below 1', { material: 'aisi_304', T_K: '0' }],
    ['unknown material', { material: 'copper', T_K: '800' }],
  ])('%s - rejected', async (_case, query) => {
    const { errors } = await check(query as Record<string, string>);
    expect(errors.length).toBeGreaterThan(0);
  });
});
