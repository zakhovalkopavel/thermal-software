import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { MaterialGroupRouteParamDto } from '../../../../../src/modules/refractory/dto/material-catalog/material-group-route-param.dto';
import { MaterialGroupRoute } from '../../../../../src/modules/refractory/enums/material-group-route.enum';

const VALIDATION_OPTIONS = { whitelist: true, forbidNonWhitelisted: true };

const errorsFor = async (groupRoute: string) =>
  validate(plainToInstance(MaterialGroupRouteParamDto, { groupRoute }), VALIDATION_OPTIONS);

describe('MaterialGroupRouteParamDto', () => {
  it.each(Object.values(MaterialGroupRoute))('%s - accepted', async route => {
    expect(await errorsFor(route)).toHaveLength(0);
  });

  it.each(['unknown', 'metals', 'oxide'])('%s - rejected', async route => {
    expect((await errorsFor(route)).length).toBeGreaterThan(0);
  });
});
