import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../../../../src/modules/auth/services/auth.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService', () => {
  const repository = {
    find: jest.fn(),
    save: jest.fn(),
  };
  const jwtService = {
    signAsync: jest.fn(async () => 'token'),
  };
  const service = new AuthService(repository as never, jwtService as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns access token for valid password', async () => {
    repository.find.mockResolvedValue([{ id: 'admin-1', passwordHash: 'hash' }]);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    const result = await service.login('password12');
    expect(result.accessToken).toBe('token');
    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: 'admin-1',
      role: 'admin',
    });
  });

  it('rejects invalid password', async () => {
    repository.find.mockResolvedValue([{ id: 'admin-1', passwordHash: 'hash' }]);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    await expect(service.login('wrong-password')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
