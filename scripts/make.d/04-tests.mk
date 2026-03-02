# Test targets
.PHONY: test-backend test-frontend test-service test-blend-demo

test-backend: ## Run backend tests inside the backend container
	@echo "🧪 Running backend tests inside Docker Compose (service: backend)"
	@# If backend container is running use exec, otherwise run a one-off container
	@if [ -n "$(shell docker-compose -f compose.yml ps -q backend 2>/dev/null)" ]; then \
		docker-compose -f compose.yml exec -T backend sh -lc 'cd /app && npm test --silent'; \
	else \
		docker-compose -f compose.yml run --rm backend sh -lc 'cd /app && npm test --silent'; \
	fi

test-frontend: ## Run frontend tests inside the frontend container
	@echo "🧪 Running frontend tests inside Docker Compose (service: frontend)"
	@if [ -n "$(shell docker-compose -f compose.yml ps -q frontend 2>/dev/null)" ]; then \
		docker-compose -f compose.yml exec -T frontend sh -lc 'cd /app && npm test --silent'; \
	else \
		docker-compose -f compose.yml run --rm frontend sh -lc 'cd /app && npm test --silent'; \
	fi

# Generic service test runner: make test-service SERVICE=<service>
test-service: ## Run tests in a specific service (SERVICE=<name>)
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

# Blend Optimizer Demo Tests (with clean output)
test-blend-demo: ## Run blend optimizer demo tests (filtered output)
	@echo "🎯 Running blend optimizer demo tests..."
	@if [ -n "$$(docker-compose -f compose.yml ps -q backend 2>/dev/null)" ]; then \
		docker-compose -f compose.yml exec -T backend sh -c "npm test -- blend-optimizer-demo.spec.ts --verbose=false 2>&1 | grep -v -E '(console\\.log$$|at Object\\.<anonymous>|at Array\\.forEach|at TestScheduler|^\\s+at test/)' | sed '/^$$/N;/^\\n$$/D'"; \
	else \
		docker-compose -f compose.yml run --rm backend sh -c "npm test -- blend-optimizer-demo.spec.ts --verbose=false 2>&1 | grep -v -E '(console\\.log$$|at Object\\.<anonymous>|at Array\\.forEach|at TestScheduler|^\\s+at test/)' | sed '/^$$/N;/^\\n$$/D'"; \
	fi


