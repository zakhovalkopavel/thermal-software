.PHONY: help up down restart logs build test dev clean

# Default target
help:
	@echo "Thermal Software - Docker Management"
	@echo ""
	@echo "Main Commands:"
	@echo "  make up          - Start all services (auto-builds on first run)"
	@echo "  make down        - Stop all services"
	@echo "  make restart     - Restart all services"
	@echo "  make logs        - View logs from all services"
	@echo ""
	@echo "Refractory Calculator:"
	@echo "  make build       - Build TypeScript"
	@echo "  make test        - Run tests"
	@echo "  make dev         - Start development watch mode"
	@echo "  make clean       - Clean build artifacts"
	@echo ""
	@echo "Access:"
	@echo "  Web Interface:   http://localhost:18080/public/"
	@echo "  Node.js API:     http://localhost:3010"
	@echo ""
	@echo "Advanced:"
	@echo "  make stopall     - Stop ALL Docker containers on system"
	@echo "  make shell       - Access container shell"

# Start services (builds automatically on first run)
up:
	@echo "🚀 Starting services..."
	docker-compose up -d --build
	@echo "✅ Services started!"
	@echo "📊 Web Interface: http://localhost:18080/ (redirects to /refractory-calculator/)"
	@echo "⚙️  API Server: http://localhost:3010"

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

# Build TypeScript
build:
	@echo "🔨 Building TypeScript..."
	docker exec thermal-app sh -c "npm run build"
	@echo "✅ Build complete!"

# Run tests
test:
	@echo "🧪 Running tests..."
	docker exec thermal-app sh -c "node  refractory-test.js"

# Development watch mode
dev:
	@echo "👁️  Starting development watch mode..."
	@echo "Press Ctrl+C to stop"
	docker exec -it thermal-app sh -c "npm run dev"

# Clean build artifacts
clean:
	@echo "🧹 Cleaning build artifacts..."
	docker exec thermal-app sh -c "npm run clean"
	@echo "✅ Clean complete!"

# Stop ALL Docker containers on the system
stopall:
	@echo "⚠️  Stopping ALL Docker containers on the system..."
	@docker stop $$(docker ps -aq) 2>/dev/null || echo "No containers running"
	@echo "✅ All containers stopped!"

# Access container shell
shell:
	@echo "🐚 Accessing thermal-app container..."
	docker exec -it thermal-app sh

# Legacy commands (for backwards compatibility)
refractory-build: build
refractory-test: test
refractory-dev: dev
refractory-clean: clean
refractory-shell: shell
