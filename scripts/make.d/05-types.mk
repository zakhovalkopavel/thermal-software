# TypeScript type checking
.PHONY: check-types check-types-pattern check-types-verbose

check-types: ## Check TypeScript types (backend)
	@echo "🔍 Checking TypeScript compilation (backend)..."
	@if [ -n "$(shell docker-compose -f compose.yml ps -q backend 2>/dev/null)" ]; then \
		docker-compose -f compose.yml exec -T backend sh -lc 'cd /app && npx tsc --noEmit 2>&1 | grep -i "error" | head -50'; \
	else \
		docker-compose -f compose.yml run --rm backend sh -lc 'cd /app && npx tsc --noEmit 2>&1 | grep -i "error" | head -50'; \
	fi

check-types-pattern: ## Check TypeScript types matching PATTERN
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

check-types-verbose: ## Check TypeScript types (verbose - all errors)
	@echo "🔍 Checking TypeScript compilation (verbose - all errors)..."
	@if [ -n "$(shell docker-compose -f compose.yml ps -q backend 2>/dev/null)" ]; then \
		docker-compose -f compose.yml exec -T backend sh -lc 'cd /app && npx tsc --noEmit'; \
	else \
		docker-compose -f compose.yml run --rm backend sh -lc 'cd /app && npx tsc --noEmit'; \
	fi
