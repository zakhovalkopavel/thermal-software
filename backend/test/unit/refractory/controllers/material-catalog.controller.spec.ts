import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AddressInfo } from 'net';
import { RefractoryModule } from '../../../../src/modules/refractory/refractory.module';

/**
 * Boots RefractoryModule with the production ValidationPipe options and checks
 * routing over HTTP: static catalogue routes must not be captured by
 * GET /refractory/:groupRoute.
 */
describe('MaterialCatalogController (HTTP routing)', () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [RefractoryModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.setGlobalPrefix('api/v1');
    await app.listen(0);
    const { port } = app.getHttpServer().address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}/api/v1/refractory`;
  });

  afterAll(async () => {
    await app.close();
  });

  const get = async (path: string) => {
    const response = await fetch(`${baseUrl}${path}`);
    return { status: response.status, body: await response.json() };
  };

  it('GET /materials - library list, not a group route', async () => {
    const { status, body } = await get('/materials');
    expect(status).toBe(200);
    expect(body).toHaveLength(102);
  });

  it('GET /material-groups - group summaries', async () => {
    const { status, body } = await get('/material-groups');
    expect(status).toBe(200);
    expect(body[0]).toHaveProperty('route');
    expect(body[0]).toHaveProperty('count');
  });

  it('GET /particle-sizes - six tables', async () => {
    const { status, body } = await get('/particle-sizes');
    expect(status).toBe(200);
    expect(Object.keys(body).sort()).toEqual(['cement', 'classifications', 'fepaF', 'fepaP', 'mesh', 'standard']);
  });

  it('GET /mix-components - six mix groups', async () => {
    const { status, body } = await get('/mix-components');
    expect(status).toBe(200);
    expect(body).toHaveLength(6);
  });

  it('GET /material-categories - every material once', async () => {
    const { status, body } = await get('/material-categories');
    expect(status).toBe(200);
    const total = body.reduce((sum: number, c: { materials: unknown[] }) => sum + c.materials.length, 0);
    expect(total).toBe(102);
  });

  it('GET /refractories/properties with query-string T_K - 200', async () => {
    const { status, body } = await get('/refractories/properties?material=chamotte_solid&T_K=1273');
    expect(status).toBe(200);
    expect(body.T_K).toBe(1273);
    expect(typeof body.lambda_WmK).toBe('number');
  });

  it('GET /oxides - group route', async () => {
    const { status, body } = await get('/oxides');
    expect(status).toBe(200);
    expect(body.length).toBeGreaterThan(0);
  });

  it('GET /unknown - 400', async () => {
    expect((await get('/unknown')).status).toBe(400);
  });

  it('GET /materials/unknown - 404', async () => {
    expect((await get('/materials/unknown_material')).status).toBe(404);
  });

  it('GET /materials?group=oxide - unknown query parameter, 400', async () => {
    expect((await get('/materials?group=oxide')).status).toBe(400);
  });

  it('POST /mix/composition - 200 with fired-basis result', async () => {
    const response = await fetch(`${baseUrl}/mix/composition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fractions: [{ materialId: 'kaolinite', massFraction: 1 }] }),
    });
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.basis).toBe('fired');
    expect(body.lossOnIgnition_wt).toBeCloseTo(14, 6);
  });
});
