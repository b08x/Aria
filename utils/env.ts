import { Provider } from '../types';

// Check if we're running in Docker with runtime environment variables
const getRuntimeEnv = () => {
  return (window as any).ENV || {};
};

// Environment variable helper functions
export const getEnvApiKey = (provider: Provider): string => {
  const runtimeEnv = getRuntimeEnv();
  
  switch (provider) {
    case 'google':
      return runtimeEnv.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
    case 'openai':
      return runtimeEnv.OPENAI_API_KEY || process.env.OPENAI_API_KEY || '';
    case 'anthropic':
      return runtimeEnv.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY || '';
    case 'mistral':
      return runtimeEnv.MISTRAL_API_KEY || process.env.MISTRAL_API_KEY || '';
    case 'openrouter':
      return runtimeEnv.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY || '';
    default:
      return '';
  }
};

export const getGoogleSearchApiKey = (): string => {
  const runtimeEnv = getRuntimeEnv();
  return runtimeEnv.GOOGLE_SEARCH_API_KEY || process.env.GOOGLE_SEARCH_API_KEY || '';
};

export const getGoogleSearchEngineId = (): string => {
  const runtimeEnv = getRuntimeEnv();
  return runtimeEnv.GOOGLE_SEARCH_ENGINE_ID || process.env.GOOGLE_SEARCH_ENGINE_ID || '';
};

export const getElevenLabsApiKey = (): string => {
  const runtimeEnv = getRuntimeEnv();
  return runtimeEnv.ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY || '';
};

export const hasEnvApiKey = (provider: Provider): boolean => {
  return getEnvApiKey(provider).length > 0;
};