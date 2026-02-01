#!/bin/bash
# Backend Dependencies Installation Script
# Run inside backend container: docker-compose exec backend sh < scripts/install-backend-deps.sh
# Date: February 1, 2026
set -e
echo "Installing backend dependencies..."
npm install --save @nestjs/common @nestjs/core @nestjs/platform-express @nestjs/config @nestjs/swagger @nestjs/typeorm @nestjs/jwt @nestjs/passport passport passport-jwt passport-local bcrypt class-validator class-transformer typeorm pg redis reflect-metadata rxjs
npm install --save-dev @nestjs/cli @nestjs/schematics @nestjs/testing @types/express @types/jest @types/node @types/passport-jwt @types/passport-local @types/bcrypt @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint eslint-config-prettier eslint-plugin-prettier jest prettier source-map-support ts-jest ts-loader ts-node tsconfig-paths typescript
echo "✅ Backend dependencies installed"
