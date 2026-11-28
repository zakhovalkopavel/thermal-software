import { ConflictException, NotFoundException } from '@nestjs/common';
import { PageKind } from '../../../../src/modules/cms/enums/page-kind.enum';
import { PageMapperService } from '../../../../src/modules/cms/services/page-mapper.service';
import { PageService } from '../../../../src/modules/cms/services/page.service';

describe('PageService', () => {
  const repository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({
      id: '1',
      updatedAt: new Date(),
      published: true,
      resume: '',
      bodyHtml: null,
      seoTitle: null,
      seoDescription: null,
      seoKeywords: null,
      ogImageUrl: null,
      canonicalPath: null,
      ...value,
    })),
    createQueryBuilder: jest.fn(),
  };

  const service = new PageService(repository as never, new PageMapperService());

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('normalizes path and returns published page', async () => {
    repository.findOne.mockResolvedValue({
      id: '1',
      path: '/about',
      kind: PageKind.Standalone,
      title: 'About',
      resume: 'resume',
      bodyHtml: '<p>x</p>',
      seoTitle: null,
      seoDescription: null,
      seoKeywords: null,
      ogImageUrl: null,
      canonicalPath: null,
      published: true,
      updatedAt: new Date(),
    });
    const page = await service.findPublishedByPath('about');
    expect(page.path).toBe('/about');
    expect(repository.findOne).toHaveBeenCalledWith({
      where: { path: '/about', published: true },
    });
  });

  it('throws when published page is missing', async () => {
    repository.findOne.mockResolvedValue(null);
    await expect(service.findPublishedByPath('/missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects duplicate create', async () => {
    repository.findOne.mockResolvedValue({ id: '1', path: '/about' });
    await expect(
      service.create({
        path: '/about',
        kind: PageKind.Standalone,
        title: 'About',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
