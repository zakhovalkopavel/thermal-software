import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUser } from '../cms/entities/admin-user.entity';
import { AUTH_CONSTANTS } from './constants/auth.constants';
import { AuthController } from './controllers/auth.controller';
import { AdminBootstrapService } from './services/admin-bootstrap.service';
import { AuthService } from './services/auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: AUTH_CONSTANTS.JWT_STRATEGY }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const expiresIn = config.get<string>('JWT_EXPIRES_IN') || '15m';
        return {
          secret: config.getOrThrow<string>('JWT_SECRET'),
          signOptions: {
            expiresIn: expiresIn as `${number}m` | `${number}s` | `${number}h` | `${number}d`,
          },
        };
      },
    }),
    TypeOrmModule.forFeature([AdminUser]),
  ],
  controllers: [AuthController],
  providers: [AuthService, AdminBootstrapService, JwtStrategy],
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}
