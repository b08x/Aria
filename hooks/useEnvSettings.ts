import { useEffect } from 'react';
import { Settings, Provider } from '../types';
import { INITIAL_SETTINGS } from '../constants';

// Environment variable helper functions
const getEnvApiKey = (provider: Provider): string => {
  switch (provider) {
    case 'google':
      return process.env.GEMINI_API_KEY || '';
    case 'openai':
      return process.env.OPENAI_API_KEY || '';
    case 'anthropic':
      return process.env.ANTHROPIC_API_KEY || '';
    case 'mistral':
      return process.env.MISTRAL_API_KEY || '';
    case 'openrouter':
      return process.env.OPENROUTER_API_KEY || '';
    default:
      return '';
  }
};

export const useEnvSettings = (
  setSettings: React.Dispatch<React.SetStateAction<Settings>>,
  setApiKeyStatus: React.Dispatch<React.SetStateAction<Record<string, any>>>
) => {
  useEffect(() => {
    // Initialize settings with environment variables
    const envSettings: Partial<Settings> = {};
    let hasAnyKey = false;

    // Check each provider for environment variables
    const providers: Provider[] = ['google', 'openai', 'anthropic', 'mistral', 'openrouter'];
    const providerWithKey = providers.find(provider => {
      const key = getEnvApiKey(provider);
      if (key) {
        hasAnyKey = true;
        return true;
      }
      return false;
    });

    if (providerWithKey) {
      envSettings.provider = providerWithKey;
      envSettings.apiKey = getEnvApiKey(providerWithKey);
    }

    // Set additional service keys
    const googleSearchKey = process.env.GOOGLE_SEARCH_API_KEY || '';
    const googleSearchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID || '';
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY || '';

    if (googleSearchKey) envSettings.googleCseApiKey = googleSearchKey;
    if (googleSearchEngineId) envSettings.googleCseId = googleSearchEngineId;
    if (elevenLabsKey) envSettings.elevenLabsApiKey = elevenLabsKey;

    // Update settings if we found any environment variables
    if (hasAnyKey || googleSearchKey || googleSearchEngineId || elevenLabsKey) {
      setSettings(prev => ({ ...prev, ...envSettings }));
      
      // Mark API keys as valid if they exist in environment
      if (envSettings.provider && envSettings.apiKey) {
        setApiKeyStatus(prev => ({ ...prev, [envSettings.provider!]: 'valid' }));
      }
    }
  }, [setSettings, setApiKeyStatus]);
};