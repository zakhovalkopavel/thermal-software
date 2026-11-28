import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUser } from '../modules/cms/entities/admin-user.entity';
import { Page } from '../modules/cms/entities/page.entity';
import { SiteSetting } from '../modules/cms/entities/site-setting.entity';
import { CmsInitial1740000000000 } from './migrations/1740000000000-CmsInitial';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.getOrThrow<string>('DB_HOST'),
        port: Number(config.getOrThrow<string>('DB_PORT')),
        username: config.getOrThrow<string>('DB_USERNAME'),
        password: config.getOrThrow<string>('DB_PASSWORD'),
        database: config.getOrThrow<string>('DB_DATABASE'),
        entities: [AdminUser, Page, SiteSetting],
        migrations: [CmsInitial1740000000000],
        synchronize: false,
        // Apply CMS migrations on boot so admin bootstrap can insert the first user.
        migrationsRun: true,
      }),
    }),
  ],
})
export class DatabaseModule {}
