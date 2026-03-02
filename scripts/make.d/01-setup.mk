# Setup and secrets
.PHONY: setup setup-secrets generate-jwt check-env

setup: ## Create a .env from .env.example (initial setup)
	@echo "🔧 Setting up Thermal Software project..."
	@if [ -f .env ]; then \
		echo "⚠️  .env file already exists!"; \
		read -p "Overwrite? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1; \
	fi
	@cp .env.example .env
	@echo "✅ Created .env from .env.example"
	@echo ""
	@echo "⚙️  Next steps:"
	@echo "  1. Run: make setup-secrets   (generates secure JWT tokens)"
	@echo "  2. Edit .env if needed:      vim .env"
	@echo "  3. Start services:           make up"
	@echo ""

check-env: ## Verify .env exists (used by up/rebuild)
	@if [ ! -f .env ]; then \
		echo "❌ ERROR: .env file not found!"; \
		echo "   Run: make setup"; \
		exit 1; \
	fi

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
