#!/bin/bash
# Master Installation Script - Installs all dependencies
# Date: February 1, 2026
set -e
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"
echo "════════════════════════════════════════════════════════════"
echo "Installing Backend Dependencies"
echo "════════════════════════════════════════════════════════════"
docker-compose up -d backend
sleep 3
docker-compose exec -T backend sh < scripts/install-backend-deps.sh
docker cp thermal-backend:/app/package.json backend/
docker cp thermal-backend:/app/package-lock.json backend/
echo "✅ Backend done"
echo ""
echo "════════════════════════════════════════════════════════════"
echo "Installing Frontend Dependencies"
echo "════════════════════════════════════════════════════════════"
docker-compose up -d frontend
sleep 3
docker-compose exec -T frontend sh < scripts/install-frontend-deps.sh
docker cp thermal-frontend:/app/package.json frontend/
docker cp thermal-frontend:/app/package-lock.json frontend/
echo "✅ Frontend done"
echo ""
echo "════════════════════════════════════════════════════════════"
echo "Rebuilding Containers"
echo "════════════════════════════════════════════════════════════"
docker-compose down
docker-compose build backend frontend
docker-compose up -d
echo ""
echo "✅ All dependencies installed! Access: http://localhost:80"
