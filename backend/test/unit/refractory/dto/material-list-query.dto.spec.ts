import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { MaterialListQueryDto } from '../../../../src/modules/refractory/dto/material-list-query.dto';
import { MATERIAL_CATALOG_CONSTANTS } from '../../../../src/modules/refractory/constants/material-catalog.constants';

const VALIDATION_OPTIONS = { whitelist: true, forbidNonWhitelisted: true };

const errorsFor = async (query: Record<string, string>) =>
  validate(plainToInstance(MaterialListQueryDto, query), VALIDATION_OPTIONS);

describe('MaterialListQueryDto', () => {
  it('empty query - accepted', async () => {
    expect(await errorsFor({})).toHaveLength(0);
  });

  it('valid type and search - accepted', async () => {
    expect(await errorsFor({ type: 'clay', search: 'kaolin' })).toHaveLength(0);
  });

  it('invalid type - rejected', async () => {
    expect((await errorsFor({ type: 'metal' })).length).toBeGreaterThan(0);
  });

  it('search at the length limit - accepted; above - rejected', async () => {
    const max = MATERIAL_CATALOG_CONSTANTS.SEARCH_MAX_LENGTH;
    expect(await errorsFor({ search: 'a'.repeat(max) })).toHaveLength(0);
    expect((await errorsFor({ search: 'a'.repeat(max + 1) })).length).toBeGreaterThan(0);
  });

  it('unknown parameter - rejected', async () => {
    expect((await errorsFor({ group: 'oxide' })).length).toBeGreaterThan(0);
  });
});
