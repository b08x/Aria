
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Settings, Provider, ApiKeyStatus } from '../types';
import { PROVIDERS, MODEL_GUIDE } from '../constants';
import { validateApiKey, fetchAvailableModels } from '../services/aiService';

interface ProviderSetupPageProps {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  apiKeyStatus: Record<string, ApiKeyStatus>;
  setApiKeyStatus: React.Dispatch<React.SetStateAction<Record<string, ApiKeyStatus>>>;
  onComplete: () => void;
  dynamicModels: Record<string, string[]>;
  setDynamicModels: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
}

// Using a map for env vars for easier access and to keep logic clean.
const ENV_API_KEYS: Record<Provider, string | undefined> = {
    google: (window as any).process?.env?.GOOGLE_API_KEY,
    openai: (window as any).process?.env?.OPENAI_API_KEY,
    anthropic: (window as any).process?.env?.ANTHROPIC_API_KEY,
    mistral: (window as any).process?.env?.MISTRAL_API_KEY,
    openrouter: (window as any).process?.env?.OPENROUTER_API_KEY,
};

const ProviderSetupPage: React.FC<ProviderSetupPageProps> = ({ 
    settings, 
    setSettings, 
    apiKeyStatus, 
    setApiKeyStatus, 
    onComplete,
    dynamicModels,
    setDynamicModels
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [isKeyFromEnv, setIsKeyFromEnv] = useState(false);

  // This effect will run when the component mounts and when the provider changes.
  useEffect(() => {
    const apiKeyFromEnv = ENV_API_KEYS[settings.provider];

    const validateAndFetch = async (newSettings: Settings) => {
        setIsVerifying(true);
        const status = await validateApiKey(newSettings);
        setApiKeyStatus(prev => ({ ...prev, [newSettings.provider]: status }));
        setIsVerifying(false);

        if (status === 'valid') {
            setIsFetchingModels(true);
            try {
                const models = await fetchAvailableModels(newSettings);
                setDynamicModels(prev => ({ ...prev, [newSettings.provider]: models }));
                setSettings(s => {
                    // Update model only if current one is not in the new list
                    if (s.provider === newSettings.provider && !models.includes(s.model)) {
                        return { ...s, model: models[0] || '' };
                    }
                    return s;
                });
            } catch(e) {
                console.error("Failed to fetch models after env key validation", e);
            } finally {
                setIsFetchingModels(false);
            }
        }
    };

    if (apiKeyFromEnv) {
        setIsKeyFromEnv(true);
        // Create a temporary settings object to avoid stale state issues in async validation.
        const newSettings = { ...settings, apiKey: apiKeyFromEnv };
        setSettings(newSettings);
        validateAndFetch(newSettings);
    } else {
        setIsKeyFromEnv(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.provider]);


  const isNextDisabled = useMemo(() => {
    return isVerifying || isFetchingModels || apiKeyStatus[settings.provider] !== 'valid';
  }, [isVerifying, isFetchingModels, apiKeyStatus, settings.provider]);

  const handleSettingsChange = useCallback((field: keyof Settings, value: any) => {
    setSettings(prevSettings => {
      const newState = { ...prevSettings, [field]: value };
      if (field === 'provider') {
        const newProvider = value as Provider;
        const availableModels = dynamicModels[newProvider] || PROVIDERS[newProvider].models;
        newState.model = availableModels[0] || '';
        // Clear API key on provider switch. The useEffect will repopulate it if an env var exists.
        newState.apiKey = ''; 
        setApiKeyStatus(prevStatus => ({ ...prevStatus, [newProvider]: 'unverified' }));
      } else if (field === 'apiKey') {
         // If user types, it's no longer an env key and it needs re-validation.
        setIsKeyFromEnv(false);
        setApiKeyStatus(prevStatus => ({ ...prevStatus, [prevSettings.provider]: 'unverified' }));
      }
      return newState;
    });
  }, [setSettings, setApiKeyStatus, dynamicModels]);
  
  const handleValidate = async () => {
    if (!settings.apiKey || isKeyFromEnv) return;
    setIsVerifying(true);
    const status = await validateApiKey(settings);
    setApiKeyStatus(prev => ({...prev, [settings.provider]: status }));
    setIsVerifying(false);
    
    if (status === 'valid') {
        setIsFetchingModels(true);
        try {
            const models = await fetchAvailableModels(settings);
            setDynamicModels(prev => ({...prev, [settings.provider]: models}));
            if (!models.includes(settings.model)) {
                handleSettingsChange('model', models[0] || '');
            }
        } catch (e) {
            console.error("Failed to fetch models", e);
        } finally {
            setIsFetchingModels(false);
        }
    }
  };

  const commonInputClasses = "w-full px-3 py-2 bg-surface border border-muted text-primary rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-accent transition-colors placeholder-secondary disabled:bg-muted/30";
  const modelInfo = MODEL_GUIDE[settings.model] || { name: settings.model, description: 'No guide available for this model.', strengths: '' };
  
  const modelList = dynamicModels[settings.provider] || PROVIDERS[settings.provider].models;
  const modelsAreLoading = isFetchingModels && (!dynamicModels[settings.provider] || dynamicModels[settings.provider]?.length === 0);

  const getStatusIndicator = () => {
    if(isVerifying) return <span className="text-xs text-yellow-400 animate-pulse">Validating...</span>;
    switch(apiKeyStatus[settings.provider]) {
        case 'valid': return <span className="text-xs text-green-400">Verified</span>;
        case 'invalid': return <span className="text-xs text-red-300">Invalid Key</span>;
        case 'ratelimited': return <span className="text-xs text-orange-400">Service Unavailable</span>;
        default: return <span className="text-xs text-secondary">Unverified</span>;
    }
  };

  return (
    <div className="min-h-screen bg-background text-primary flex items-center justify-center p-4">
      <div className="max-w-3xl w-full mx-auto">
        {/* Single Column Configuration Panel */}
        <div className="bg-surface p-8 rounded-lg border border-muted">
            <h1 className="text-3xl font-bold text-accent mb-2">Configure Your AI Assistant</h1>
            <p className="text-secondary mb-8">Select your AI provider and provide a valid API key to continue.</p>

            <div className="space-y-6">
                {/* Provider Selection */}
                <div>
                    <label className="block text-sm font-medium text-primary/80 mb-2">AI Provider</label>
                    <div className="grid grid-cols-3 gap-2">
                    {Object.entries(PROVIDERS).map(([key, { name }]) => (
                        <button
                            key={key}
                            onClick={() => handleSettingsChange('provider', key)}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors border ${settings.provider === key ? 'bg-accent text-background border-accent' : 'bg-background/50 border-muted hover:bg-muted/50'}`}
                        >{name}</button>
                    ))}
                    </div>
                </div>

                {/* API Key */}
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-primary/80">API Key</label>
                        {getStatusIndicator()}
                    </div>
                     <div className="flex items-center space-x-2">
                        <input 
                            type="password" 
                            value={settings.apiKey} 
                            onChange={e => handleSettingsChange('apiKey', e.target.value)} 
                            placeholder={isKeyFromEnv ? 'API Key set from environment' : `Enter your ${PROVIDERS[settings.provider].name} API key`}
                            className={`${commonInputClasses} flex-1`}
                            disabled={isKeyFromEnv}
                        />
                        <button
                            type="button"
                            onClick={handleValidate}
                            disabled={!settings.apiKey.trim() || isVerifying || apiKeyStatus[settings.provider] === 'valid' || isKeyFromEnv}
                            className="px-4 py-2 text-sm font-semibold text-background bg-accent-dark rounded-md transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-accent disabled:bg-muted disabled:cursor-not-allowed flex-shrink-0"
                        >
                            {apiKeyStatus[settings.provider] === 'valid' 
                                ? 'Validated' 
                                : isVerifying 
                                    ? 'Validating...' 
                                    : 'Validate'}
                        </button>
                    </div>
                     {isKeyFromEnv && (
                        <p className="text-xs text-secondary mt-1 pl-1">
                            This API key has been automatically loaded from an environment variable.
                        </p>
                    )}
                </div>
                
                {/* Model and Parameters */}
                <fieldset className="border border-muted p-4 rounded-md space-y-4" disabled={isNextDisabled}>
                    <legend className="text-sm font-semibold text-accent px-1">Model Parameters</legend>
                    <div>
                        <label htmlFor="model-select" className="block text-sm font-medium text-primary/80 mb-1">Model</label>
                        <select id="model-select" value={settings.model} onChange={e => handleSettingsChange('model', e.target.value)} className={commonInputClasses} disabled={modelsAreLoading}>
                            {modelsAreLoading ? (
                                <option>Loading models...</option>
                            ) : (
                                modelList.map(model => ( <option key={model} value={model}>{model}</option> ))
                            )}
                        </select>
                    </div>
                    
                    {/* Integrated Model Guide */}
                    <div className="bg-background/50 p-4 rounded-lg border border-muted">
                        <h3 className="text-xl font-bold text-accent mb-2">{modelInfo.name}</h3>
                        <p className="text-primary/80 text-sm mb-3">{modelInfo.description}</p>
                        <div className="bg-accent/10 border-l-4 border-accent p-3 rounded-r-lg text-sm">
                            <p className="font-semibold text-accent">{modelInfo.strengths}</p>
                        </div>
                    </div>

                     <div>
                        <label htmlFor="temperature" className="block text-sm font-medium text-primary/80 mb-1">Temperature: <span className="font-mono text-accent">{settings.temperature.toFixed(1)}</span></label>
                        <input id="temperature" type="range" min="0" max="1" step="0.1" value={settings.temperature} onChange={e => handleSettingsChange('temperature', parseFloat(e.target.value))} className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer" />
                        <div className="flex justify-between text-xs text-secondary mt-1"><span>Creative</span><span>Precise</span></div>
                    </div>
                     <div>
                        <label htmlFor="topP" className="block text-sm font-medium text-primary/80 mb-1">Top-P: <span className="font-mono text-accent">{settings.topP.toFixed(1)}</span></label>
                        <input id="topP" type="range" min="0" max="1" step="0.1" value={settings.topP} onChange={e => handleSettingsChange('topP', parseFloat(e.target.value))} className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer" />
                     </div>
                </fieldset>
            </div>
            <button
                onClick={onComplete}
                disabled={isNextDisabled}
                className="w-full mt-8 px-4 py-3 bg-accent-dark text-background text-lg font-semibold rounded-lg hover:bg-accent transition-colors focus:outline-none focus:ring-4 focus:ring-accent/50 disabled:bg-muted disabled:cursor-not-allowed"
            >
                Next
            </button>
        </div>
      </div>
    </div>
  );
};

export default ProviderSetupPage;
