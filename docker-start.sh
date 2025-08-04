#!/bin/bash

# ARIA Docker Management Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# --- Detect compose command ---
if command -v podman-compose &> /dev/null; then
    COMPOSE_CMD="podman-compose"
elif command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    echo -e "${RED}[ERROR]${NC} Neither 'podman-compose' nor 'docker-compose' found. Please install one of them."
    exit 1
fi
# --- End of detection ---

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

# Check if .env file exists
check_env_file() {
    if [ ! -f ".env" ]; then
        print_warning ".env file not found. Creating from template..."
        cp .env.docker .env
        print_status "Created .env file from template"
        print_warning "Please edit .env file and add your API keys before starting"
        exit 1
    fi
}

# Show help
show_help() {
    echo "ARIA Docker Management Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start      Start development containers"
    echo "  stop       Stop all containers"
    echo "  restart    Restart containers"
    echo "  logs       Show container logs"
    echo "  build      Build containers"
    echo "  clean      Clean up containers and images"
    echo "  prod       Start production containers"
    echo "  dev        Start development with hot reload"
    echo "  status     Show container status"
    echo "  health     Check application health"
    echo "  shell      Open shell in running container"
    echo "  help       Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start                 # Start development containers"
    echo "  $0 prod                  # Start production containers"
    echo "  $0 logs                  # View logs"
    echo "  $0 shell                 # Open shell in container"
}

# Start development containers
start_dev() {
    print_header "Starting ARIA Development Containers"
    check_env_file
    $COMPOSE_CMD up -d
    print_status "Containers started successfully!"
    print_status "Application available at: http://localhost"
    print_status "Health check: http://localhost/health"
}

# Start production containers
start_prod() {
    print_header "Starting ARIA Production Containers"
    check_env_file
    $COMPOSE_CMD -f docker-compose.prod.yml up -d
    print_status "Production containers started successfully!"
    print_status "Application available at: http://localhost"
}

# Start development with hot reload
start_dev_reload() {
    print_header "Starting ARIA Development with Hot Reload"
    check_env_file
    $COMPOSE_CMD --profile dev up -d
    print_status "Development containers with hot reload started!"
    print_status "nginx: http://localhost:80"
    print_status "Vite dev server: http://localhost:5173"
}

# Stop containers
stop_containers() {
    print_header "Stopping ARIA Containers"
    $COMPOSE_CMD down
    $COMPOSE_CMD -f docker-compose.prod.yml down 2>/dev/null || true
    print_status "Containers stopped successfully!"
}

# Restart containers
restart_containers() {
    print_header "Restarting ARIA Containers"
    stop_containers
    start_dev
}

# Show logs
show_logs() {
    print_header "ARIA Container Logs"
    $COMPOSE_CMD logs -f --tail=50
}

# Build containers
build_containers() {
    print_header "Building ARIA Containers"
    $COMPOSE_CMD build --no-cache
    print_status "Containers built successfully!"
}

# Clean up
clean_up() {
    print_header "Cleaning Up ARIA Docker Resources"
    print_warning "This will remove all containers, networks, volumes, and images associated with ARIA. Continue? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        $COMPOSE_CMD down -v --rmi all --remove-orphans
        $COMPOSE_CMD -f docker-compose.prod.yml down -v --rmi all --remove-orphans 2>/dev/null || true
        print_status "Cleanup completed!"
    else
        print_status "Cleanup cancelled"
    fi
}

# Show status
show_status() {
    print_header "ARIA Container Status"
    $COMPOSE_CMD ps
    echo ""
    print_header "Docker System Info"
    docker system df
}

# Health check
health_check() {
    print_header "ARIA Health Check"
    if curl -f http://localhost/health >/dev/null 2>&1; then
        print_status "✅ Application is healthy!"
        echo "Response: $(curl -s http://localhost/health)"
    else
        print_error "❌ Application health check failed!"
        print_warning "Check container logs: $0 logs"
    fi
}

# Open shell
open_shell() {
    print_header "Opening Shell in ARIA Container"
    container_name=$($COMPOSE_CMD ps -q aria-app)
    if [ -z "$container_name" ]; then
        print_error "No running ARIA container found. Start containers first: $0 start"
        exit 1
    fi
    docker exec -it "$container_name" sh
}

# Main script logic
case "${1:-}" in
    start)
        start_dev
        ;;
    stop)
        stop_containers
        ;;
    restart)
        restart_containers
        ;;
    logs)
        show_logs
        ;;
    build)
        build_containers
        ;;
    clean)
        clean_up
        ;;
    prod)
        start_prod
        ;;
    dev)
        start_dev_reload
        ;;
    status)
        show_status
        ;;
    health)
        health_check
        ;;
    shell)
        open_shell
        ;;
    help|--help|-h)
        show_help
        ;;
    "")
        print_error "No command specified. Use '$0 help' for usage information."
        exit 1
        ;;
    *)
        print_error "Unknown command: $1"
        print_status "Use '$0 help' for usage information."
        exit 1
        ;;
esac