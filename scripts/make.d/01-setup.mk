# Setup and secrets
.PHONY: setup setup-secrets generate-jwt check-env init-submodules update-submodules sync-vendor-env

setup: ## Init submodules, create .env, sync vendor envs
	@echo "🔧 Setting up Thermal Software project..."
	@$(MAKE) init-submodules
	@if [ -f .env ]; then \
		echo "⚠️  .env file already exists!"; \
		read -p "Overwrite? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1; \
	fi
	@cp .env.example .env
	@echo "✅ Created .env from .env.example"
	@$(MAKE) sync-vendor-env
	@echo ""
	@echo "⚙️  Next steps:"
	@echo "  1. Run: make setup-secrets   (generates secure JWT tokens)"
	@echo "  2. Edit .env if needed:      vim .env"
	@echo "  3. Sync vendor envs again:   make sync-vendor-env"
	@echo "  4. Start services:           make up"
	@echo ""

check-env: ## Verify .env exists (used by up/rebuild)
	@if [ ! -f .env ]; then \
		echo "❌ ERROR: .env file not found!"; \
		echo "   Run: make setup"; \
		exit 1; \
	fi

_require-gitmodules:
	@if [ ! -f .gitmodules ]; then \
		echo "❌ ERROR: .gitmodules missing — register page-ocr and source-extract as submodules first."; \
		exit 1; \
	fi

init-submodules: _require-gitmodules ## Clone vendor/* at the commits pinned by this repo
	@echo "📦 Initializing git submodules (vendor/page-ocr, vendor/source-extract)…"
	@git submodule update --init --recursive
	@echo "✅ Submodules ready (pinned commits)"

update-submodules: _require-gitmodules ## Fetch latest remote commits for vendor/*
	@echo "⬆️  Updating git submodules from remotes (vendor/page-ocr, vendor/source-extract)…"
	@git submodule sync --recursive
	@git submodule update --init --remote --recursive
	@echo "✅ Submodules updated to remote tracking tips (branch from .gitmodules)"
	@echo "   Parent repo now points at new SHAs — commit when ready:"
	@echo "     git add vendor/page-ocr vendor/source-extract && git commit"

sync-vendor-env: check-env ## Fill vendor/*/ .env from the main project .env
	@chmod +x scripts/sync-vendor-env.sh
	@./scripts/sync-vendor-env.sh


setup-secrets: ## Generate secure JWT secrets and DB password into .env
	@echo "🔐 Generating secure JWT secrets using OpenSSL..."
	@$(MAKE) check-env
	@echo ""
	@echo "Generating JWT_SECRET..."
	@JWT_SECRET=$$(docker run --rm alpine/openssl rand -base64 32 | tr -d '\n'); \
	sed -i.bak "s|JWT_SECRET=.*|JWT_SECRET=$$JWT_SECRET|" .env
	@echo "✅ JWT_SECRET generated"
	@echo ""
	@echo "Generating JWT_REFRESH_SECRET..."
	@JWT_REFRESH_SECRET=$$(docker run --rm alpine/openssl rand -base64 32 | tr -d '\n'); \
	sed -i.bak "s|JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=$$JWT_REFRESH_SECRET|" .env
	@echo "✅ JWT_REFRESH_SECRET generated"
	@echo ""
	@echo "Generating secure DB_PASSWORD..."
	@DB_PASSWORD=$$(docker run --rm alpine/openssl rand -base64 24 | tr -d '\n'); \
	sed -i.bak "s|DB_PASSWORD=.*|DB_PASSWORD=$$DB_PASSWORD|" .env
	@echo "✅ DB_PASSWORD generated"
	@rm -f .env.bak
	@echo ""
	@echo "✅ All secrets generated and saved to .env"
	@echo ""
	@echo "📝 Secrets have been set in .env file"
	@echo "⚠️  DO NOT commit .env to git!"
	@echo ""
	@echo "🚀 Next step: make up"

generate-jwt: ## Print freshly-generated secrets to stdout (for copy/paste)
	@echo "🔐 Generating new JWT secrets..."
	@echo ""
	@echo "This will generate new secrets but NOT update .env automatically."
	@echo "Use these in production or for token rotation."
	@echo ""
	@echo "JWT_SECRET:"
	@docker run --rm alpine/openssl rand -base64 32
	@echo ""
	@echo "JWT_REFRESH_SECRET:"
	@docker run --rm alpine/openssl rand -base64 32
	@echo ""
	@echo "DB_PASSWORD:"
	@docker run --rm alpine/openssl rand -base64 24
	@echo ""
	@echo "To update .env with these values:"
	@echo "  1. Copy the secrets above"
	@echo "  2. Edit .env: vim .env"
	@echo "  3. Paste the new values"
	@echo "  4. Restart services: make restart"
