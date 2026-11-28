import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { AdminUser } from '../../cms/entities/admin-user.entity';
import { AUTH_CONSTANTS } from '../constants/auth.constants';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { LoginResponseDto } from '../dto/login-response.dto';
import type { JwtPayload } from '../types/jwt-payload.type';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(AdminUser)
    private readonly adminUserRepository: Repository<AdminUser>,
    private readonly jwtService: JwtService,
  ) {}

  async login(password: string): Promise<LoginResponseDto> {
    const admin = await this.adminUserRepository.find({ take: 1 });
    const user = admin[0];
    if (!user) {
      throw new UnauthorizedException('Admin user is not configured');
    }
    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException('Invalid password');
    }
    const payload: JwtPayload = { sub: user.id, role: 'admin' };
    return {
      accessToken: await this.jwtService.signAsync(payload),
    };
  }

  async changePassword(
    user: AdminUser,
    dto: ChangePasswordDto,
  ): Promise<void> {
    const matches = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        'New password must differ from the current password',
      );
    }
    user.passwordHash = await bcrypt.hash(
      dto.newPassword,
      AUTH_CONSTANTS.BCRYPT_ROUNDS,
    );
    await this.adminUserRepository.save(user);
  }
}
