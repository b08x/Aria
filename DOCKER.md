# 🐳 Docker Setup for ARIA

This document provides instructions for running ARIA using Docker with nginx as a reverse proxy.

## 🚀 Quick Start

### 1. **Configure Environment Variables**

```bash
# Copy the environment template
cp .env.docker .env

# Edit the .env file and add your API keys
nano .env
```

### 2. **Choose Your Deployment Mode**

#### Production Mode (Recommended)
```bash
# Build and start the production container
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop
docker-compose -f docker-compose.prod.yml down
```

#### Development Mode
```bash
# Build and start the development container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

#### Development with Hot Reload
```bash
# Start with development profile (includes hot reload)
docker-compose --profile dev up -d

# This starts both the nginx container and a Vite dev server
# nginx: http://localhost:80
# Vite dev server: http://localhost:5173
```

## 📋 Available Commands

### Docker Compose Commands
```bash
# Start services
docker-compose up -d

# Start production services
docker-compose -f docker-compose.prod.yml up -d

# Start with SSL support (production only)
docker-compose -f docker-compose.prod.yml --profile ssl up -d

# Start with monitoring (production only)
docker-compose -f docker-compose.prod.yml --profile monitoring up -d

# View logs
docker-compose logs -f aria-app

# Stop services
docker-compose down

# Rebuild and start
docker-compose up -d --build

# Remove everything including volumes
docker-compose down -v --remove-orphans
```

### Docker Commands
```bash
# Build the image manually
docker build -t aria-app .

# Run a single container
docker run -d \
  --name aria-app \
  -p 80:80 \
  -e GEMINI_API_KEY="your-key" \
  aria-app

# Execute commands in running container
docker exec -it aria-app sh

# View container logs
docker logs aria-app
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NGINX_HOST` | Hostname for nginx | No | `localhost` |
| `GEMINI_API_KEY` | Google Gemini API key | Yes* | - |
| `OPENAI_API_KEY` | OpenAI API key | Yes* | - |
| `ANTHROPIC_API_KEY` | Anthropic Claude API key | Yes* | - |
| `MISTRAL_API_KEY` | Mistral AI API key | Yes* | - |
| `OPENROUTER_API_KEY` | OpenRouter API key | Yes* | - |
| `GOOGLE_SEARCH_API_KEY` | Google Custom Search API | No | - |
| `GOOGLE_SEARCH_ENGINE_ID` | Google Search Engine ID | No | - |
| `ELEVENLABS_API_KEY` | ElevenLabs TTS API key | No | - |

*At least one AI provider API key is required.

### Custom nginx Configuration

To customize nginx configuration:

1. Edit `nginx/nginx.conf` for global settings
2. Edit `nginx/default.conf.template` for server configuration
3. Rebuild the container: `docker-compose up -d --build`

## 🌐 Access Points

### Default Ports
- **Main Application**: http://localhost:80
- **Development Server**: http://localhost:5173 (dev profile only)
- **Prometheus** (monitoring profile): http://localhost:9090

### Health Checks
- **Health endpoint**: http://localhost/health
- **Container health**: `docker ps` (shows health status)

## 🔐 Production Considerations

### SSL/HTTPS Setup
```bash
# Enable SSL with Let's Encrypt
docker-compose -f docker-compose.prod.yml --profile ssl up -d

# Make sure to set these environment variables:
# NGINX_HOST=yourdomain.com
# LETSENCRYPT_EMAIL=your@email.com
```

### Security Features
- Read-only root filesystem
- Non-privileged nginx user
- Security headers configured
- No new privileges allowed
- Minimal attack surface

### Resource Limits
Production compose includes:
- Memory limit: 512MB
- CPU limit: 0.5 cores
- Memory reservation: 256MB
- CPU reservation: 0.25 cores

## 📊 Monitoring

### Built-in Health Checks
- Container health status via Docker
- nginx health endpoint at `/health`
- Application startup validation

### Optional Prometheus Integration
```bash
# Start with monitoring
docker-compose -f docker-compose.prod.yml --profile monitoring up -d

# Access Prometheus at http://localhost:9090
```

## 🐛 Troubleshooting

### Common Issues

#### Container won't start
```bash
# Check logs
docker-compose logs aria-app

# Check container status
docker ps -a

# Validate environment
docker-compose config
```

#### API keys not working
```bash
# Verify environment variables are loaded
docker exec aria-app env | grep API_KEY

# Check environment injection
docker exec aria-app cat /usr/share/nginx/html/env-config.js
```

#### nginx configuration errors
```bash
# Test nginx config
docker exec aria-app nginx -t

# Reload nginx
docker exec aria-app nginx -s reload
```

#### Network issues
```bash
# Check if ports are available
netstat -tulpn | grep :80

# Check container networking
docker network ls
docker network inspect aria_aria-network
```

### Debugging Commands
```bash
# Enter container shell
docker exec -it aria-app sh

# View nginx error logs
docker exec aria-app tail -f /var/log/nginx/error.log

# View nginx access logs
docker exec aria-app tail -f /var/log/nginx/access.log

# Check environment variables
docker exec aria-app printenv
```

## 🔄 Updates and Maintenance

### Updating the Application
```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose up -d --build

# Or for production
docker-compose -f docker-compose.prod.yml up -d --build
```

### Backup and Restore
```bash
# Backup configuration
tar -czf aria-backup.tar.gz .env docker-compose*.yml nginx/

# Restore configuration
tar -xzf aria-backup.tar.gz
```

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [nginx Documentation](https://nginx.org/en/docs/)
- [ARIA Application Documentation](./README.md)