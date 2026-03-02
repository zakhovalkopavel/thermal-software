# Logging helpers
.PHONY: logs logs-backend logs-frontend logs-nginx logs-postgres logs-redis logs-python logs-service

logs: ## View logs from all services (follow)
	@echo "📋 Viewing logs (Ctrl+C to exit)..."
	docker-compose logs -f

logs-backend: ## Tail backend service logs
	@echo "📋 Backend logs (service: backend)"
	docker-compose -f compose.yml logs -f backend

logs-frontend: ## Tail frontend service logs
	@echo "📋 Frontend logs (service: frontend)"
	docker-compose -f compose.yml logs -f frontend

logs-nginx: ## Tail nginx service logs
	@echo "📋 Nginx logs (service: nginx)"
	docker-compose -f compose.yml logs -f nginx

logs-postgres: ## Tail postgres service logs
	@echo "📋 Postgres logs (service: postgres)"
	docker-compose -f compose.yml logs -f postgres

logs-redis: ## Tail redis service logs
	@echo "📋 Redis logs (service: redis)"
	docker-compose -f compose.yml logs -f redis

logs-python: ## Tail python helper container logs
	@echo "📋 Python helper container logs (service: python)"
	docker-compose -f compose.yml logs -f python

logs-service: ## Tail logs for a specific service (SERVICE=<name>)
	@if [ -z "$(SERVICE)" ]; then \
		echo "Usage: make logs-service SERVICE=<service-name>"; \
		exit 1; \
	fi
	@echo "📋 Tailing logs for service: $(SERVICE)"
	docker-compose -f compose.yml logs -f $(SERVICE)

