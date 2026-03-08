# Docker-related targets: up, down, restart, rebuild, shell access
.PHONY: up down restart rebuild sync-node-modules python-shell backend-shell frontend-shell nginx-shell postgres-shell redis-shell

up: ## Start all services (uses existing images; use 'make rebuild' to force rebuild)
	@$(MAKE) check-env
	@echo "🚀 Starting services..."
	docker-compose up -d
	@echo "✅ Services started!"
	@echo ""
	@echo "Access the application:"
	@awk -F= '/^HTTP_PORT=/ {h=$$2} END {printf "  Frontend: http://localhost:%s\n  Backend:  http://localhost:%s\n", h, h}' .env
	@$(MAKE) sync-node-modules
	@echo "📋 Showing logs..."
	docker-compose logs -f

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
	@$(MAKE) up

# Sync node_modules from containers to host if package-lock.json differs
sync-node-modules: ## Sync node_modules from backend/frontend containers to host if package-lock.json changed
	@echo "🔄 Checking node_modules sync for backend and frontend..."
	@for svc in backend frontend; do \
		container_id=$$(docker compose ps -q $$svc 2>/dev/null || true); \
		if [ -z "$$container_id" ]; then \
			echo "  ⚠️  [$$svc] Container not running, skipping sync."; \
			continue; \
		fi; \
		HOST_LOCK="$$svc/package-lock.json"; \
		CONTAINER_LOCK=$$(docker exec "$$container_id" cat /app/package-lock.json 2>/dev/null || true); \
		if [ -z "$$CONTAINER_LOCK" ]; then \
			echo "  ⚠️  [$$svc] Cannot read package-lock.json from container, skipping sync."; \
			continue; \
		fi; \
		HOST_LOCK_CONTENT=$$(cat "$$HOST_LOCK" 2>/dev/null || true); \
		NM_EMPTY=0; \
		if [ ! -d "$$svc/node_modules" ] || [ -z "$$(ls -A "$$svc/node_modules" 2>/dev/null)" ]; then \
			NM_EMPTY=1; \
		fi; \
		if [ "$$HOST_LOCK_CONTENT" = "$$CONTAINER_LOCK" ] && [ "$$NM_EMPTY" = "0" ]; then \
			echo "  ✅ [$$svc] package-lock.json matches and node_modules is present — skipping sync."; \
		else \
			if [ "$$NM_EMPTY" = "1" ]; then \
				echo "  📦 [$$svc] node_modules is empty — syncing from container..."; \
			else \
				echo "  📦 [$$svc] package-lock.json differs — syncing node_modules from container..."; \
			fi; \
			HOST_NM="$$svc/node_modules"; \
			TMPTAR=$$(mktemp /tmp/node_modules_XXXXXX.tar); \
			echo "  [$$svc] Creating tar archive from container..."; \
			docker exec -u root "$$container_id" sh -c "cd /app && tar -cf - node_modules" > "$$TMPTAR"; \
			echo "  [$$svc] Clearing host node_modules..."; \
			sudo rm -rf "$$HOST_NM"; \
			echo "  [$$svc] Extracting..."; \
			sudo tar -C "$$svc" -xf "$$TMPTAR" --no-same-owner; \
			rm -f "$$TMPTAR"; \
			sudo chown -R "$$(id -u):$$(id -g)" "$$HOST_NM"; \
			echo "  ✅ [$$svc] node_modules synced from container."; \
		fi; \
	done
	@echo "✅ node_modules sync complete."

# Restart services
restart: ## Restart services (down then up)
	@echo "🔄 Restarting services..."
	@$(MAKE) down
	@$(MAKE) up

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
