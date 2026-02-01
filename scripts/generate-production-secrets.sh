#!/bin/bash
# Generate JWT secrets in production (inside running containers)
# This script can be executed via SSH on production servers

set -e

echo "═══════════════════════════════════════════════════════════"
echo "JWT Secrets Generator - Production Environment"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "This script generates secure JWT secrets for production use."
echo "It works inside Docker containers pulled from registry."
echo ""

# Function to check if container is running
check_container() {
    if docker ps --format '{{.Names}}' | grep -q "^$1$"; then
        return 0
    else
        return 1
    fi
}

# Function to generate secret using container
generate_secret() {
    local length=${1:-32}
    docker run --rm alpine/openssl rand -base64 "$length" | tr -d '\n'
}

echo "─────────────────────────────────────────────────────────────"
echo "Option 1: Generate secrets (display only)"
echo "─────────────────────────────────────────────────────────────"
echo ""

read -p "Generate new secrets? (y/N): " generate
if [ "$generate" = "y" ] || [ "$generate" = "Y" ]; then
    echo ""
    echo "Generating secrets using alpine/openssl container..."
    echo ""

    JWT_SECRET=$(generate_secret 32)
    JWT_REFRESH_SECRET=$(generate_secret 32)
    DB_PASSWORD=$(generate_secret 24)

    echo "─────────────────────────────────────────────────────────────"
    echo "Generated Secrets:"
    echo "─────────────────────────────────────────────────────────────"
    echo ""
    echo "JWT_SECRET=${JWT_SECRET}"
    echo ""
    echo "JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}"
    echo ""
    echo "DB_PASSWORD=${DB_PASSWORD}"
    echo ""
    echo "─────────────────────────────────────────────────────────────"
    echo ""
    echo "⚠️  IMPORTANT:"
    echo "  1. Copy these secrets to a secure location"
    echo "  2. Update your .env file on the production server"
    echo "  3. Restart services: docker-compose restart"
    echo "  4. DO NOT commit these to git!"
    echo ""

    # Ask if should update .env
    if [ -f .env ]; then
        echo "─────────────────────────────────────────────────────────────"
        read -p "Update .env file with these secrets? (y/N): " update_env
        if [ "$update_env" = "y" ] || [ "$update_env" = "Y" ]; then
            # Backup .env
            cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
            echo "✅ Backup created: .env.backup.$(date +%Y%m%d_%H%M%S)"

            # Update secrets
            sed -i.tmp "s|JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" .env
            sed -i.tmp "s|JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}|" .env
            sed -i.tmp "s|DB_PASSWORD=.*|DB_PASSWORD=${DB_PASSWORD}|" .env
            rm -f .env.tmp

            echo "✅ .env file updated with new secrets"
            echo ""
            echo "⚠️  Services must be restarted for changes to take effect:"
            echo "   docker-compose restart backend"
            echo ""
        fi
    fi
fi

echo "─────────────────────────────────────────────────────────────"
echo "Option 2: Generate secrets inside running container"
echo "─────────────────────────────────────────────────────────────"
echo ""

read -p "Generate secrets using running backend container? (y/N): " use_backend
if [ "$use_backend" = "y" ] || [ "$use_backend" = "Y" ]; then
    if check_container "thermal-backend"; then
        echo ""
        echo "Using thermal-backend container..."
        echo ""

        echo "JWT_SECRET:"
        docker exec thermal-backend sh -c "apk add --no-cache openssl >/dev/null 2>&1; openssl rand -base64 32"
        echo ""

        echo "JWT_REFRESH_SECRET:"
        docker exec thermal-backend sh -c "openssl rand -base64 32"
        echo ""

        echo "DB_PASSWORD:"
        docker exec thermal-backend sh -c "openssl rand -base64 24"
        echo ""
    else
        echo "❌ ERROR: thermal-backend container is not running"
        echo "   Start services first: docker-compose up -d"
        exit 1
    fi
fi

echo "─────────────────────────────────────────────────────────────"
echo "Option 3: SSH into production and generate"
echo "─────────────────────────────────────────────────────────────"
echo ""
echo "For remote production servers, use:"
echo ""
echo "ssh user@production-server << 'EOF'"
echo "cd /path/to/thermal-software"
echo "./scripts/generate-production-secrets.sh"
echo "EOF"
echo ""
echo "Or interactively:"
echo "ssh user@production-server"
echo "cd /path/to/thermal-software"
echo "docker exec thermal-backend sh -c 'openssl rand -base64 32'"
echo ""

echo "═══════════════════════════════════════════════════════════"
echo "Done!"
echo "═══════════════════════════════════════════════════════════"

