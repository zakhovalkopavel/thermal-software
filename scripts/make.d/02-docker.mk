# Docker-related targets: up, down, restart, rebuild, python-bash
.PHONY: up down restart rebuild python-bash

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

python-bash: ## Enter a shell in the python container
	@echo "🐍 Entering Python container shell..."
	@if [ -z "$$(docker-compose ps -q python 2>/dev/null)" ]; then \
		echo "⚠️  Python container is not running. Starting it..."; \
		docker-compose up -d python; \
		sleep 2; \
	fi
	@docker-compose exec python bash

