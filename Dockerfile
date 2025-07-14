# Multi-stage Dockerfile for ARIA React Application

# Stage 1: Build the application
FROM node:20-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Create a template .env file if it doesn't exist
RUN if [ ! -f .env.local ]; then cp .env.example .env.local 2>/dev/null || echo "# Environment variables will be injected at runtime" > .env.local; fi

# Build the application
RUN npm run build

# Stage 2: Nginx server
FROM nginx:alpine

# Install envsubst for environment variable substitution
RUN apk add --no-cache gettext

# Copy nginx configuration
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy environment setup script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

# Expose port
EXPOSE 80

# Use custom entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]