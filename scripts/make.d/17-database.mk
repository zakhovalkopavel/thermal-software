.PHONY: db-install db-migrate db-seed

db-install: ## Run CMS migrations and import shared/seed/cms JSON
	@echo "🗄️  Installing CMS database schema and seed…"
	@docker compose exec backend npm run db:install
	@echo "✅ db-install complete"

db-migrate: ## Run TypeORM migrations only
	@docker compose exec backend npx ts-node --transpile-only -e "\
	  const { AppDataSource } = require('./src/database/data-source.ts');\
	  AppDataSource.initialize().then(async (ds) => {\
	    const m = await ds.runMigrations();\
	    console.log(m.map((x) => x.name));\
	    await ds.destroy();\
	  });"

db-seed: ## Re-import CMS seed JSON (upsert by path/key)
	@docker compose exec backend npx ts-node --transpile-only -e "\
	  const { NestFactory } = require('@nestjs/core');\
	  const { AppModule } = require('./src/app.module');\
	  const { CmsSeedService } = require('./src/modules/cms/services/cms-seed.service');\
	  (async () => {\
	    const app = await NestFactory.createApplicationContext(AppModule);\
	    const result = await app.get(CmsSeedService).importAll();\
	    console.log(result);\
	    await app.close();\
	  })();"
