# Docker Frontend - React SPA Builder
# Builds the React application and keeps it ready for serving
# The nginx reverse proxy container will serve the built static files

ARG NODE_VERSION
FROM node:${NODE_VERSION}

LABEL maintainer="Thermal Software Team"
LABEL version="2.0.0-dev"
LABEL description="React Frontend Builder for Thermal Software"

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci && \
    npm cache clean --force

# Copy source code
COPY . .

# Build argument for API URL
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Build application with Vite
RUN npm run build

# Keep container running to serve built files via volume
# The nginx proxy will access /app/dist via shared volume
CMD ["tail", "-f", "/dev/null"]

