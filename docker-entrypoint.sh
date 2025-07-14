#!/bin/sh

# Docker entrypoint script for ARIA application
# Handles environment variable substitution and nginx configuration

set -e

echo "🚀 Starting ARIA application..."

# Set default values for environment variables
export NGINX_HOST=${NGINX_HOST:-localhost}

# Environment variables for the application
export GEMINI_API_KEY=${GEMINI_API_KEY:-""}
export OPENAI_API_KEY=${OPENAI_API_KEY:-""}
export ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY:-""}
export MISTRAL_API_KEY=${MISTRAL_API_KEY:-""}
export OPENROUTER_API_KEY=${OPENROUTER_API_KEY:-""}
export GOOGLE_SEARCH_API_KEY=${GOOGLE_SEARCH_API_KEY:-""}
export GOOGLE_SEARCH_ENGINE_ID=${GOOGLE_SEARCH_ENGINE_ID:-""}
export ELEVENLABS_API_KEY=${ELEVENLABS_API_KEY:-""}

echo "📝 Configuring nginx with environment variables..."

# Substitute environment variables in nginx configuration
envsubst '${NGINX_HOST}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

# Inject environment variables into the built JavaScript files
echo "🔧 Injecting runtime environment variables..."

# Create a JavaScript file with environment variables
cat > /usr/share/nginx/html/env-config.js << EOF
window.ENV = {
  GEMINI_API_KEY: '${GEMINI_API_KEY}',
  OPENAI_API_KEY: '${OPENAI_API_KEY}',
  ANTHROPIC_API_KEY: '${ANTHROPIC_API_KEY}',
  MISTRAL_API_KEY: '${MISTRAL_API_KEY}',
  OPENROUTER_API_KEY: '${OPENROUTER_API_KEY}',
  GOOGLE_SEARCH_API_KEY: '${GOOGLE_SEARCH_API_KEY}',
  GOOGLE_SEARCH_ENGINE_ID: '${GOOGLE_SEARCH_ENGINE_ID}',
  ELEVENLABS_API_KEY: '${ELEVENLABS_API_KEY}'
};
EOF

# Modify the index.html to include the env-config.js file
if [ -f /usr/share/nginx/html/index.html ]; then
    # Add the script tag before the closing </head> tag
    sed -i 's|</head>|  <script src="/env-config.js"></script>\n</head>|' /usr/share/nginx/html/index.html
    echo "✅ Environment configuration injected into index.html"
else
    echo "⚠️  Warning: index.html not found, environment variables may not be available to the application"
fi

# Test nginx configuration
echo "🔍 Testing nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
else
    echo "❌ Nginx configuration is invalid"
    exit 1
fi

# Print some useful information
echo "🌐 ARIA will be available on:"
echo "   - http://${NGINX_HOST}"
if [ "${NGINX_HOST}" != "localhost" ]; then
    echo "   - http://localhost"
fi

# Log environment status (without revealing sensitive values)
echo "🔐 Environment status:"
[ -n "$GEMINI_API_KEY" ] && echo "   ✅ Gemini API key configured" || echo "   ⚠️  Gemini API key not set"
[ -n "$OPENAI_API_KEY" ] && echo "   ✅ OpenAI API key configured" || echo "   ⚠️  OpenAI API key not set"
[ -n "$ANTHROPIC_API_KEY" ] && echo "   ✅ Anthropic API key configured" || echo "   ⚠️  Anthropic API key not set"
[ -n "$MISTRAL_API_KEY" ] && echo "   ✅ Mistral API key configured" || echo "   ⚠️  Mistral API key not set"
[ -n "$OPENROUTER_API_KEY" ] && echo "   ✅ OpenRouter API key configured" || echo "   ⚠️  OpenRouter API key not set"
[ -n "$ELEVENLABS_API_KEY" ] && echo "   ✅ ElevenLabs API key configured" || echo "   ⚠️  ElevenLabs API key not set"

echo "🎉 ARIA application is ready!"

# Execute the main command
exec "$@"