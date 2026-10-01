import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { MaterialIdParamDto } from '../../../../../src/modules/refractory/dto/material-catalog/material-id-param.dto';

const VALIDATION_OPTIONS = { whitelist: true, forbidNonWhitelisted: true };

const errorsFor = async (materialId: string) =>
  validate(plainToInstance(MaterialIdParamDto, { materialId }), VALIDATION_OPTIONS);

describe('MaterialIdParamDto', () => {
  it('non-empty id - accepted', async () => {
    expect(await errorsFor('kaolinite')).toHaveLength(0);
  });

  it('empty string - rejected', async () => {
    expect((await errorsFor('')).length).toBeGreaterThan(0);
  });
});
