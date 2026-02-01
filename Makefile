.PHONY: help setup setup-secrets generate-jwt up down restart logs clean-reports stop-all build-images push-images deploy-build build-version

# Default target
help:
	@echo "Thermal Software - Docker Management"
	@echo ""
	@echo "Setup:"
	@echo "  make setup          - Initial project setup (copy .env.example to .env)"
	@echo "  make setup-secrets  - Generate secure JWT secrets (run after setup)"
	@echo "  make generate-jwt   - Generate new JWT secrets (production/rotation)"
	@echo ""
	@echo "Main Commands:"
	@echo "  make up             - Start all services (auto-builds on first run)"
	@echo "  make down           - Stop all services"
	@echo "  make restart        - Restart all services"
	@echo "  make logs           - View logs from all services"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean-reports  - Clean old report files (>30 days)"
	@echo "  make stop-all        - Stop ALL Docker containers on system"
	@echo ""
	@echo "Deployment:"
	@echo "  make build-images   - Build Docker images for registry"
	@echo "  make push-images    - Push Docker images to registry"
	@echo "  make deploy-build   - Build and push images (complete workflow)"
	@echo "  make build-version VERSION=x.y.z - Build specific version"
	@echo ""
	@echo "Access:"
	@echo "  Frontend:           http://localhost:${FRONTEND_PORT}"
	@echo "  Backend API:        http://localhost:${BACKEND_PORT}/api/v1"
	@echo "  API Docs:           http://localhost:${BACKEND_PORT}/api/docs"

# Setup project (first time setup)
setup:
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

# Generate secure JWT secrets using OpenSSL in Docker
setup-secrets:
	@echo "🔐 Generating secure JWT secrets using OpenSSL..."
	@if [ ! -f .env ]; then \
		echo "❌ ERROR: .env file not found!"; \
		echo "   Run: make setup"; \
		exit 1; \
	fi
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

# Generate new JWT secrets (for production or token rotation)
generate-jwt:
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

# Start services (builds automatically on first run)
up:
	@if [ ! -f .env ]; then \
		echo "❌ .env file not found!"; \
		echo ""; \
		echo "Run: make setup"; \
		echo "Then edit .env and run: make up"; \
		exit 1; \
	fi
	@echo "🚀 Starting services..."
	docker-compose up -d --build
	@echo "✅ Services started!"
	@echo ""
	@echo "Access the application:"
	@echo "  Frontend: http://localhost:\$$(grep FRONTEND_PORT .env | cut -d '=' -f2)"
	@echo "  Backend:  http://localhost:\$$(grep BACKEND_PORT .env | cut -d '=' -f2)"

# Stop services
down:
	@echo "🛑 Stopping services..."
	docker-compose down
	@echo "✅ Services stopped!"

# Restart services
restart:
	@echo "🔄 Restarting services..."
	@$(MAKE) down
	@$(MAKE) up
	@echo "📋 Showing logs..."
	docker-compose logs -f

# View logs
logs:
	@echo "📋 Viewing logs (Ctrl+C to exit)..."
	docker-compose logs -f


# Clean old report files (keep directory structure)
clean-reports:
	@echo "🧹 Cleaning old report files..."
	@find tmp/reports -type f ! -name '.gitkeep' ! -name 'README.md' -mtime +30 -delete 2>/dev/null || true
	@echo "✅ Old reports cleaned (files older than 30 days)"

# Stop ALL Docker containers (use with caution!)
stop-all:
	@echo "⚠️  Stopping ALL Docker containers on system..."
	@docker stop $$(docker ps -aq) 2>/dev/null || echo "No containers running"
	@echo "✅ All containers stopped"

# Build Docker images for registry
build-images:
	@echo "🏗️  Building Docker images..."
	@./scripts/build-and-push.sh --skip-login --skip-push

# Push Docker images to registry
push-images:
	@echo "📤 Pushing Docker images to registry..."
	@./scripts/build-and-push.sh --skip-build

# Build and push Docker images (complete workflow)
deploy-build:
	@echo "🚀 Building and pushing Docker images..."
	@./scripts/build-and-push.sh

# Build specific version
build-version:
	@if [ -z "$(VERSION)" ]; then \
		echo "❌ ERROR: VERSION not specified"; \
		echo "Usage: make build-version VERSION=1.0.0"; \
		exit 1; \
	fi
	@echo "🏗️  Building version $(VERSION)..."
	@./scripts/build-and-push.sh --version $(VERSION)

