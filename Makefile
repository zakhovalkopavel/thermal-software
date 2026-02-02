.PHONY: help setup setup-secrets generate-jwt up down restart logs clean-reports stop-all build-images push-images deploy-build build-version logs-backend logs-frontend logs-nginx logs-postgres logs-redis logs-python logs-service copy-node-modules copy-node-modules-force test-backend test-frontend test-service check-types check-types-pattern check-types-verbose

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
	@echo "  make logs-backend   - Tail backend service logs"
	@echo "  make logs-frontend  - Tail frontend service logs"
	@echo "  make logs-nginx     - Tail nginx service logs"
	@echo "  make logs-postgres  - Tail postgres service logs"
	@echo "  make logs-redis     - Tail redis service logs"
	@echo "  make logs-python    - Tail python service logs"
	@echo "  make logs-service SERVICE=myservice - Tail a specific service (generic)"
	@echo "  make copy-node-modules         - Copy node_modules from running containers to host (backend, frontend)"
	@echo "  make copy-node-modules-force   - Force copy node_modules from containers to host (passes --force to script)"
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
	@echo "Testing:"
	@echo "  make test-backend   - Run backend tests inside container"
	@echo "  make test-frontend  - Run frontend tests inside container"
	@echo "  make test-service SERVICE=myservice - Run tests in specific service"
	@echo ""
	@echo "Type Checking:"
	@echo "  make check-types                    - Check TypeScript types (errors only)"
	@echo "  make check-types-pattern PATTERN=<pattern> - Check specific service/pattern"
	@echo "  make check-types-verbose            - Show all TypeScript errors (detailed)"
	@echo ""
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

# Service-specific logs (shortcuts)
logs-backend:
	@echo "📋 Backend logs (service: backend)"
	docker-compose -f compose.yml logs -f backend

logs-frontend:
	@echo "📋 Frontend logs (service: frontend)"
	docker-compose -f compose.yml logs -f frontend

logs-nginx:
	@echo "📋 Nginx logs (service: nginx)"
	docker-compose -f compose.yml logs -f nginx

logs-postgres:
	@echo "📋 Postgres logs (service: postgres)"
	docker-compose -f compose.yml logs -f postgres

logs-redis:
	@echo "📋 Redis logs (service: redis)"
	docker-compose -f compose.yml logs -f redis

logs-python:
	@echo "📋 Python helper container logs (service: python)"
	docker-compose -f compose.yml logs -f python

# Generic logs target: usage: make logs-service SERVICE=<service-name>
logs-service:
	@if [ -z "$(SERVICE)" ]; then \
		echo "Usage: make logs-service SERVICE=<service-name>"; \
		exit 1; \
	fi
	@echo "📋 Tailing logs for service: $(SERVICE)"
	docker-compose -f compose.yml logs -f $(SERVICE)

# Copy node_modules from running containers to host (uses scripts/copy-node-modules-from-containers.sh)
copy-node-modules:
	@echo "📦 Copying node_modules from backend/frontend containers to host"
	@test -f ./scripts/copy-node-modules-from-containers.sh || { echo "Script not found: ./scripts/copy-node-modules-from-containers.sh"; exit 1; }
	@./scripts/copy-node-modules-from-containers.sh

copy-node-modules-force:
	@echo "📦 Force copying node_modules from containers to host"
	@test -f ./scripts/copy-node-modules-from-containers.sh || { echo "Script not found: ./scripts/copy-node-modules-from-containers.sh"; exit 1; }
	@./scripts/copy-node-modules-from-containers.sh --force

# Run tests inside Docker Compose containers
# Usage: make test-backend  (runs backend tests inside the backend service container)
#        make test-frontend (runs frontend tests inside the frontend service container)
#        make test-service SERVICE=backend  (generic)

test-backend:
	@echo "🧪 Running backend tests inside Docker Compose (service: backend)"
	@# If backend container is running use exec, otherwise run a one-off container
	@if [ -n "$(shell docker-compose -f compose.yml ps -q backend 2>/dev/null)" ]; then \
		docker-compose -f compose.yml exec -T backend sh -lc 'cd /app && npm test --silent'; \
	else \
		docker-compose -f compose.yml run --rm backend sh -lc 'cd /app && npm test --silent'; \
	fi

test-frontend:
	@echo "🧪 Running frontend tests inside Docker Compose (service: frontend)"
	@if [ -n "$(shell docker-compose -f compose.yml ps -q frontend 2>/dev/null)" ]; then \
		docker-compose -f compose.yml exec -T frontend sh -lc 'cd /app && npm test --silent'; \
	else \
		docker-compose -f compose.yml run --rm frontend sh -lc 'cd /app && npm test --silent'; \
	fi

# Generic service test runner: make test-service SERVICE=<service>
test-service:
	@if [ -z "$(SERVICE)" ]; then \
		echo "Usage: make test-service SERVICE=<service>"; \
		exit 1; \
	fi
	@echo "🧪 Running tests in service: $(SERVICE)"
	@if [ -n "$(shell docker-compose -f compose.yml ps -q $(SERVICE) 2>/dev/null)" ]; then \
		docker-compose -f compose.yml exec -T $(SERVICE) sh -lc 'cd /app && npm test --silent'; \
	else \
		docker-compose -f compose.yml run --rm $(SERVICE) sh -lc 'cd /app && npm test --silent'; \
	fi

# TypeScript compilation checking
# Usage: make check-types         (check all TypeScript types in backend)
#        make check-water-demand  (check water demand service specifically)
#        make check-types-verbose (show all errors, not just filtered)

check-types:
	@echo "🔍 Checking TypeScript compilation (backend)..."
	@if [ -n "$(shell docker-compose -f compose.yml ps -q backend 2>/dev/null)" ]; then \
		docker-compose -f compose.yml exec -T backend sh -lc 'cd /app && npx tsc --noEmit 2>&1 | grep -i "error" | head -50'; \
	else \
		docker-compose -f compose.yml run --rm backend sh -lc 'cd /app && npx tsc --noEmit 2>&1 | grep -i "error" | head -50'; \
	fi

check-types-pattern:
	@if [ -z "$(PATTERN)" ]; then \
		echo "❌ ERROR: PATTERN not specified"; \
		echo ""; \
		echo "Usage: make check-types-pattern PATTERN=<search-pattern>"; \
		echo ""; \
		echo "Examples:"; \
		echo "  make check-types-pattern PATTERN=water-demand       # Check water demand service"; \
		echo "  make check-types-pattern PATTERN=packing            # Check packing service"; \
		echo "  make check-types-pattern PATTERN=error              # Show all errors"; \
		echo "  make check-types-pattern PATTERN='water|packing'    # Check multiple patterns"; \
		exit 1; \
	fi
	@echo "🔍 Checking TypeScript compilation - Pattern: $(PATTERN)..."
	@if [ -n "$(shell docker-compose -f compose.yml ps -q backend 2>/dev/null)" ]; then \
		docker-compose -f compose.yml exec -T backend sh -lc 'cd /app && npx tsc --noEmit 2>&1 | grep -i "error\|$(PATTERN)" | head -50'; \
	else \
		docker-compose -f compose.yml run --rm backend sh -lc 'cd /app && npx tsc --noEmit 2>&1 | grep -i "error\|$(PATTERN)" | head -50'; \
	fi

check-types-verbose:
	@echo "🔍 Checking TypeScript compilation (verbose - all errors)..."
	@if [ -n "$(shell docker-compose -f compose.yml ps -q backend 2>/dev/null)" ]; then \
		docker-compose -f compose.yml exec -T backend sh -lc 'cd /app && npx tsc --noEmit'; \
	else \
		docker-compose -f compose.yml run --rm backend sh -lc 'cd /app && npx tsc --noEmit'; \
	fi

