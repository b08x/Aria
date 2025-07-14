import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        host: '0.0.0.0', // Allow access from any IP
        port: 5173,
        strictPort: false, // Allow fallback to other ports
      },
      define: {
        // Legacy compatibility
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        
        // AI Provider API Keys
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.OPENAI_API_KEY': JSON.stringify(env.OPENAI_API_KEY),
        'process.env.ANTHROPIC_API_KEY': JSON.stringify(env.ANTHROPIC_API_KEY),
        'process.env.MISTRAL_API_KEY': JSON.stringify(env.MISTRAL_API_KEY),
        'process.env.OPENROUTER_API_KEY': JSON.stringify(env.OPENROUTER_API_KEY),
        
        // Additional services
        'process.env.GOOGLE_SEARCH_API_KEY': JSON.stringify(env.GOOGLE_SEARCH_API_KEY),
        'process.env.GOOGLE_SEARCH_ENGINE_ID': JSON.stringify(env.GOOGLE_SEARCH_ENGINE_ID),
        'process.env.ELEVENLABS_API_KEY': JSON.stringify(env.ELEVENLABS_API_KEY),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});