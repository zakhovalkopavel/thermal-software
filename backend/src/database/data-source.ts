import { DataSource } from 'typeorm';
import { AdminUser } from '../modules/cms/entities/admin-user.entity';
import { Page } from '../modules/cms/entities/page.entity';
import { SiteSetting } from '../modules/cms/entities/site-setting.entity';
import { CmsInitial1740000000000 } from './migrations/1740000000000-CmsInitial';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [AdminUser, Page, SiteSetting],
  migrations: [CmsInitial1740000000000],
  synchronize: false,
});
