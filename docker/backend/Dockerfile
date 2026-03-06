# Docker Backend - NestJS API
ARG NODE_VERSION
FROM node:${NODE_VERSION}

LABEL maintainer="Thermal Software Team"
LABEL version="2.0.0-dev"
LABEL description="NestJS Backend API for Thermal Software - Development"

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install all dependencies (including devDependencies needed for ts build)
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
ARG BACKEND_PORT
EXPOSE ${BACKEND_PORT:-4000}

# Always start the app
CMD ["npm", "run", "start:dev"]
