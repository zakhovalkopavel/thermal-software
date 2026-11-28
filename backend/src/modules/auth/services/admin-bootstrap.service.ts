import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { Repository } from 'typeorm';
import { CMS_ADMIN_PASSWORD_REPORT } from '../../cms/constants/cms-paths.constants';
import { AdminUser } from '../../cms/entities/admin-user.entity';
import { AUTH_CONSTANTS } from '../constants/auth.constants';

@Injectable()
export class AdminBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(AdminBootstrapService.name);

  constructor(
    @InjectRepository(AdminUser)
    private readonly adminUserRepository: Repository<AdminUser>,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const count = await this.adminUserRepository.count();
    if (count > 0) {
      return;
    }
    const fromEnv = this.config.get<string>(AUTH_CONSTANTS.ADMIN_PASSWORD_ENV);
    const password =
      fromEnv && fromEnv.trim().length >= AUTH_CONSTANTS.PASSWORD_MIN_LENGTH
        ? fromEnv.trim()
        : this.generatePassword();
    const passwordHash = await bcrypt.hash(
      password,
      AUTH_CONSTANTS.BCRYPT_ROUNDS,
    );
    await this.adminUserRepository.save(
      this.adminUserRepository.create({ passwordHash }),
    );
    await this.persistPasswordReport(password);
    this.logger.warn(
      `Initial admin password created. Change it in /admin after login. Password also written to ${CMS_ADMIN_PASSWORD_REPORT}`,
    );
    this.logger.warn(`INITIAL_ADMIN_PASSWORD=${password}`);
  }

  private generatePassword(): string {
    return randomBytes(18).toString('base64url');
  }

  private async persistPasswordReport(password: string): Promise<void> {
    const candidates = [
      join(process.cwd(), CMS_ADMIN_PASSWORD_REPORT),
      join('/app', CMS_ADMIN_PASSWORD_REPORT),
      join(process.cwd(), '..', CMS_ADMIN_PASSWORD_REPORT),
    ];
    for (const target of candidates) {
      try {
        await mkdir(dirname(target), { recursive: true });
        await writeFile(
          target,
          `Generated at ${new Date().toISOString()}\nINITIAL_ADMIN_PASSWORD=${password}\n`,
          { mode: 0o600 },
        );
        this.logger.log(`Wrote initial admin password to ${target}`);
        return;
      } catch {
        // try next candidate
      }
    }
  }
}
