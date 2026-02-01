#!/bin/bash
# Build and push Docker images to registry
# Supports versioning and multi-platform builds

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Load .env if exists
if [ -f "$PROJECT_ROOT/.env" ]; then
    source "$PROJECT_ROOT/.env"
fi

# Default values (can be overridden by .env)
DOCKER_REGISTRY="${DOCKER_REGISTRY:-docker.io}"
DOCKER_USERNAME="${DOCKER_USERNAME:-yourusername}"
IMAGE_PREFIX="${IMAGE_PREFIX:-thermal}"
VERSION="${VERSION:-$(date +%Y%m%d-%H%M%S)}"

# Images to build
IMAGES=("backend" "frontend" "nginx")

# Functions
print_header() {
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"

    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker not found. Please install Docker."
        exit 1
    fi
    print_success "Docker found: $(docker --version)"

    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_warning "Docker Compose not found (optional for build)"
    else
        print_success "Docker Compose found: $(docker-compose --version)"
    fi

    # Check if .env exists
    if [ ! -f "$PROJECT_ROOT/.env" ]; then
        print_error ".env file not found!"
        print_info "Run: make setup && make setup-secrets"
        exit 1
    fi
    print_success ".env file found"

    echo ""
}

# Login to Docker registry
docker_login() {
    print_header "Docker Registry Login"

    if [ -z "$DOCKER_PASSWORD" ]; then
        print_info "Login to $DOCKER_REGISTRY as $DOCKER_USERNAME"
        docker login "$DOCKER_REGISTRY" -u "$DOCKER_USERNAME"
    else
        echo "$DOCKER_PASSWORD" | docker login "$DOCKER_REGISTRY" -u "$DOCKER_USERNAME" --password-stdin
    fi

    if [ $? -eq 0 ]; then
        print_success "Logged in to $DOCKER_REGISTRY"
    else
        print_error "Failed to login to registry"
        exit 1
    fi

    echo ""
}

# Build single image
build_image() {
    local service=$1
    local image_name="${DOCKER_REGISTRY}/${DOCKER_USERNAME}/${IMAGE_PREFIX}-${service}"
    local dockerfile=""
    local context=""

    print_header "Building ${service} image"

    # Determine Dockerfile location and context
    case $service in
        backend)
            dockerfile="$PROJECT_ROOT/docker/backend/Dockerfile"
            context="$PROJECT_ROOT/backend"
            ;;
        frontend)
            dockerfile="$PROJECT_ROOT/docker/frontend/Dockerfile"
            context="$PROJECT_ROOT/frontend"
            ;;
        nginx)
            dockerfile="$PROJECT_ROOT/docker/nginx/Dockerfile"
            context="$PROJECT_ROOT/docker/nginx"
            ;;
        *)
            print_error "Unknown service: $service"
            return 1
            ;;
    esac

    # Build arguments from .env
    BUILD_ARGS=""
    BUILD_ARGS="$BUILD_ARGS --build-arg NODE_VERSION=$NODE_VERSION"
    BUILD_ARGS="$BUILD_ARGS --build-arg NGINX_VERSION=$NGINX_VERSION"
    BUILD_ARGS="$BUILD_ARGS --build-arg BACKEND_PORT=$BACKEND_PORT"
    BUILD_ARGS="$BUILD_ARGS --build-arg FRONTEND_PORT=$FRONTEND_PORT"
    BUILD_ARGS="$BUILD_ARGS --build-arg VITE_API_URL=$VITE_API_URL"

    print_info "Image: ${image_name}:${VERSION}"
    print_info "Dockerfile: ${dockerfile}"
    print_info "Context: ${context}"

    # Build image
    docker build \
        -f "$dockerfile" \
        -t "${image_name}:${VERSION}" \
        -t "${image_name}:latest" \
        $BUILD_ARGS \
        "$context"

    if [ $? -eq 0 ]; then
        print_success "Built ${service} image"
    else
        print_error "Failed to build ${service} image"
        return 1
    fi

    echo ""
}

# Push single image
push_image() {
    local service=$1
    local image_name="${DOCKER_REGISTRY}/${DOCKER_USERNAME}/${IMAGE_PREFIX}-${service}"

    print_header "Pushing ${service} image"

    # Push versioned tag
    print_info "Pushing ${image_name}:${VERSION}"
    docker push "${image_name}:${VERSION}"

    if [ $? -eq 0 ]; then
        print_success "Pushed ${image_name}:${VERSION}"
    else
        print_error "Failed to push ${image_name}:${VERSION}"
        return 1
    fi

    # Push latest tag
    print_info "Pushing ${image_name}:latest"
    docker push "${image_name}:latest"

    if [ $? -eq 0 ]; then
        print_success "Pushed ${image_name}:latest"
    else
        print_error "Failed to push ${image_name}:latest"
        return 1
    fi

    echo ""
}

# Save build info
save_build_info() {
    print_header "Saving Build Information"

    local build_info_file="$PROJECT_ROOT/tmp/reports/builds/build-${VERSION}.txt"
    mkdir -p "$PROJECT_ROOT/tmp/reports/builds"

    cat > "$build_info_file" << EOF
Build Information
═════════════════════════════════════════════════════════

Date: $(date)
Version: ${VERSION}
Registry: ${DOCKER_REGISTRY}
Username: ${DOCKER_USERNAME}
Prefix: ${IMAGE_PREFIX}

Images Built:
─────────────────────────────────────────────────────────
EOF

    for service in "${IMAGES[@]}"; do
        local image_name="${DOCKER_REGISTRY}/${DOCKER_USERNAME}/${IMAGE_PREFIX}-${service}"
        echo "  - ${image_name}:${VERSION}" >> "$build_info_file"
        echo "  - ${image_name}:latest" >> "$build_info_file"
    done

    cat >> "$build_info_file" << EOF

Pull Commands:
─────────────────────────────────────────────────────────
EOF

    for service in "${IMAGES[@]}"; do
        local image_name="${DOCKER_REGISTRY}/${DOCKER_USERNAME}/${IMAGE_PREFIX}-${service}"
        echo "docker pull ${image_name}:${VERSION}" >> "$build_info_file"
    done

    cat >> "$build_info_file" << EOF

Docker Compose (Production):
─────────────────────────────────────────────────────────
Update compose.yml with:

backend:
  image: ${DOCKER_REGISTRY}/${DOCKER_USERNAME}/${IMAGE_PREFIX}-backend:${VERSION}

frontend:
  image: ${DOCKER_REGISTRY}/${DOCKER_USERNAME}/${IMAGE_PREFIX}-frontend:${VERSION}

nginx:
  image: ${DOCKER_REGISTRY}/${DOCKER_USERNAME}/${IMAGE_PREFIX}-nginx:${VERSION}

═════════════════════════════════════════════════════════
EOF

    print_success "Build info saved to: $build_info_file"
    cat "$build_info_file"
    echo ""
}

# Main function
main() {
    print_header "Docker Build and Push - Thermal Software"
    echo ""
    print_info "Registry: $DOCKER_REGISTRY"
    print_info "Username: $DOCKER_USERNAME"
    print_info "Version: $VERSION"
    echo ""

    # Parse arguments
    SKIP_LOGIN=false
    SKIP_BUILD=false
    SKIP_PUSH=false

    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-login)
                SKIP_LOGIN=true
                shift
                ;;
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            --skip-push)
                SKIP_PUSH=true
                shift
                ;;
            --version)
                VERSION=$2
                shift 2
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --skip-login     Skip Docker registry login"
                echo "  --skip-build     Skip building images"
                echo "  --skip-push      Skip pushing images"
                echo "  --version VER    Use specific version tag"
                echo "  --help           Show this help"
                echo ""
                echo "Environment variables (from .env):"
                echo "  DOCKER_REGISTRY  Registry URL (default: docker.io)"
                echo "  DOCKER_USERNAME  Registry username"
                echo "  DOCKER_PASSWORD  Registry password (optional)"
                echo "  IMAGE_PREFIX     Image name prefix (default: thermal)"
                echo ""
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done

    # Check prerequisites
    check_prerequisites

    # Login to registry
    if [ "$SKIP_LOGIN" = false ]; then
        docker_login
    fi

    # Build images
    if [ "$SKIP_BUILD" = false ]; then
        for service in "${IMAGES[@]}"; do
            build_image "$service"
            if [ $? -ne 0 ]; then
                print_error "Build failed for $service"
                exit 1
            fi
        done
    fi

    # Push images
    if [ "$SKIP_PUSH" = false ]; then
        for service in "${IMAGES[@]}"; do
            push_image "$service"
            if [ $? -ne 0 ]; then
                print_error "Push failed for $service"
                exit 1
            fi
        done
    fi

    # Save build info
    save_build_info

    print_header "Build and Push Complete!"
    print_success "All images built and pushed successfully"
    print_info "Version: $VERSION"
    print_info "Registry: $DOCKER_REGISTRY"

    echo ""
    print_info "Next steps:"
    echo "  1. Update compose.yml on production server"
    echo "  2. Pull images: docker-compose pull"
    echo "  3. Restart services: docker-compose up -d"
    echo ""
}

# Run main function
main "$@"

