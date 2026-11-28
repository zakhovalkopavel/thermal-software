import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { CmsSeedService } from '../src/modules/cms/services/cms-seed.service';

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn'],
  });
  try {
    const dataSource = app.get(DataSource);
    const migrations = await dataSource.runMigrations({ transaction: 'each' });
    console.log(
      `Migrations applied: ${migrations.map((item) => item.name).join(', ') || '(none)'}`,
    );
    const seed = app.get(CmsSeedService);
    const result = await seed.importAll();
    console.log(
      `Seed complete: ${result.pages} pages, ${result.settings} settings`,
    );
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
