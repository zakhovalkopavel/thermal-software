import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { AdminUser } from '../../cms/entities/admin-user.entity';
import { AUTH_CONSTANTS } from '../constants/auth.constants';
import type { JwtPayload } from '../types/jwt-payload.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(
  Strategy,
  AUTH_CONSTANTS.JWT_STRATEGY,
) {
  constructor(
    config: ConfigService,
    @InjectRepository(AdminUser)
    private readonly adminUserRepository: Repository<AdminUser>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AdminUser> {
    const user = await this.adminUserRepository.findOne({
      where: { id: payload.sub },
    });
    if (!user || payload.role !== 'admin') {
      throw new UnauthorizedException();
    }
    return user;
  }
}
