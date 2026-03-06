# Docker-related targets: up, down, restart, rebuild, shell access
.PHONY: up down restart rebuild python-shell backend-shell frontend-shell nginx-shell postgres-shell redis-shell

up: ## Start all services (uses existing images; use 'make rebuild' to force rebuild)
	@$(MAKE) check-env
	@echo "🚀 Starting services..."
	docker-compose up -d
	@echo "✅ Services started!"
	@echo ""
	@echo "Access the application:"
	@awk -F= '/^FRONTEND_PORT=/ {f=$$2} /^BACKEND_PORT=/ {b=$$2} END {printf "  Frontend: http://localhost:%s\n  Backend:  http://localhost:%s\n", f, b}' .env

# Stop services
down: ## Stop all services
	@echo "🛑 Stopping services..."
	docker-compose down
	@echo "✅ Services stopped!"

# Rebuild services (force rebuild images and start)
rebuild: ## Force-rebuild images and start services
	@$(MAKE) check-env
	@echo "♻️  Rebuilding and starting services..."
	docker-compose build --no-cache
	docker-compose up -d
	@echo "✅ Rebuilt and started services!"

# Restart services
restart: ## Restart services (down then up)
	@echo "🔄 Restarting services..."
	@$(MAKE) down
	@$(MAKE) up
	@echo "📋 Showing logs..."
	docker-compose logs -f

python-shell: ## Enter a shell in the python container (bash)
	@echo "🐍 Entering Python container shell..."
	@if [ -z "$$(docker-compose ps -q python 2>/dev/null)" ]; then \
		echo "⚠️  Python container is not running. Starting it..."; \
		docker-compose up -d python; \
		sleep 2; \
	fi
	@docker-compose exec python bash

backend-shell: ## Enter a shell in the backend container (sh)
	@echo "🖥️  Entering Backend container shell..."
	@if [ -z "$$(docker-compose ps -q backend 2>/dev/null)" ]; then \
		echo "⚠️  Backend container is not running. Starting it..."; \
		docker-compose up -d backend; \
		sleep 2; \
	fi
	@docker-compose exec backend sh

frontend-shell: ## Enter a shell in the frontend container (sh)
	@echo "🌐 Entering Frontend container shell..."
	@if [ -z "$$(docker-compose ps -q frontend 2>/dev/null)" ]; then \
		echo "⚠️  Frontend container is not running. Starting it..."; \
		docker-compose up -d frontend; \
		sleep 2; \
	fi
	@docker-compose exec frontend sh

nginx-shell: ## Enter a shell in the nginx container (sh)
	@echo "🔀 Entering Nginx container shell..."
	@if [ -z "$$(docker-compose ps -q nginx 2>/dev/null)" ]; then \
		echo "⚠️  Nginx container is not running. Starting it..."; \
		docker-compose up -d nginx; \
		sleep 2; \
	fi
	@docker-compose exec nginx sh

postgres-shell: ## Enter a shell in the postgres container (bash)
	@echo "🗄️  Entering Postgres container shell..."
	@if [ -z "$$(docker-compose ps -q postgres 2>/dev/null)" ]; then \
		echo "⚠️  Postgres container is not running. Starting it..."; \
		docker-compose up -d postgres; \
		sleep 2; \
	fi
	@docker-compose exec postgres bash

redis-shell: ## Enter a shell in the redis container (sh)
	@echo "🟥 Entering Redis container shell..."
	@if [ -z "$$(docker-compose ps -q redis 2>/dev/null)" ]; then \
		echo "⚠️  Redis container is not running. Starting it..."; \
		docker-compose up -d redis; \
		sleep 2; \
	fi
	@docker-compose exec redis sh
