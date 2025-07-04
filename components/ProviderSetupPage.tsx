
import React, { useState, useMemo } from 'react';
import { Settings, Provider, ApiKeyStatus } from '../types';
import { PROVIDERS, MODEL_GUIDE } from '../constants';
import { validateApiKey } from '../services/aiService';

interface ProviderSetupPageProps {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  apiKeyStatus: Record<string, ApiKeyStatus>;
  setApiKeyStatus: React.Dispatch<React.SetStateAction<Record<string, ApiKeyStatus>>>;
  onComplete: () => void;
}

const ProviderSetupPage: React.FC<ProviderSetupPageProps> = ({ settings, setSettings, apiKeyStatus, setApiKeyStatus, onComplete }) => {
  const [isVerifying, setIsVerifying] = useState(false);

  const isNextDisabled = useMemo(() => {
    return isVerifying || apiKeyStatus[settings.provider] !== 'valid';
  }, [isVerifying, apiKeyStatus, settings.provider]);
  
  const handleSettingsChange = (field: keyof Settings, value: any) => {
    setSettings(prevSettings => {
      const newState = { ...prevSettings, [field]: value };
      if (field === 'provider') {
        const newProvider = value as Provider;
        newState.model = PROVIDERS[newProvider].models[0];
        newState.apiKey = ''; // Clear API key on provider switch
        // Immediately reset status for the new provider since we cleared the key
        setApiKeyStatus(prevStatus => ({ ...prevStatus, [newProvider]: 'unverified' }));
      } else if (field === 'apiKey') {
        // Reset status for the current provider as the key is being typed
        setApiKeyStatus(prevStatus => ({ ...prevStatus, [prevSettings.provider]: 'unverified' }));
      }
      return newState;
    });
  };
  
  const handleValidate = async () => {
    if (!settings.apiKey) return;
    setIsVerifying(true);
    const status = await validateApiKey(settings);
    setApiKeyStatus(prev => ({...prev, [settings.provider]: status }));
    setIsVerifying(false);
  };

  const commonInputClasses = "w-full px-3 py-2 bg-background border border-secondary/50 text-primary rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-accent transition-colors placeholder-secondary";
  const modelInfo = MODEL_GUIDE[settings.model] || { name: settings.model, description: 'No guide available for this model.', strengths: '' };

  const getStatusIndicator = () => {
    if(isVerifying) return <span className="text-xs text-yellow-400 animate-pulse">Validating...</span>;
    switch(apiKeyStatus[settings.provider]) {
        case 'valid': return <span className="text-xs text-green-400">Verified</span>;
        case 'invalid': return <span className="text-xs text-red-400">Invalid Key</span>;
        case 'ratelimited': return <span className="text-xs text-orange-400">Service Unavailable</span>;
        default: return <span className="text-xs text-secondary">Unverified</span>;
    }
  };

  return (
    <div className="min-h-screen bg-background text-primary flex items-center justify-center p-4">
      <div className="max-w-4xl w-full mx-auto grid md:grid-cols-2 gap-12 items-start">
        {/* Left Side: Configuration */}
        <div className="bg-surface p-8 rounded-lg border border-secondary/50">
            <h1 className="text-3xl font-bold text-primary mb-2">Configure Your AI Assistant</h1>
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
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors border ${settings.provider === key ? 'bg-accent text-background border-accent' : 'bg-background/50 border-secondary/50 hover:bg-secondary/50'}`}
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
                            placeholder={`Enter your ${PROVIDERS[settings.provider].name} API key`} 
                            className={`${commonInputClasses} flex-1`}
                        />
                        <button
                            type="button"
                            onClick={handleValidate}
                            disabled={!settings.apiKey.trim() || isVerifying || apiKeyStatus[settings.provider] === 'valid'}
                            className="px-4 py-2 text-sm font-semibold text-background bg-accent rounded-md transition-colors hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent disabled:bg-secondary disabled:cursor-not-allowed flex-shrink-0"
                        >
                            {apiKeyStatus[settings.provider] === 'valid' 
                                ? 'Validated' 
                                : isVerifying 
                                    ? 'Validating...' 
                                    : 'Validate'}
                        </button>
                    </div>
                </div>
                
                {/* Model and Parameters */}
                <fieldset className="border border-secondary/50 p-4 rounded-md space-y-4" disabled={isNextDisabled}>
                    <legend className="text-sm font-semibold text-accent px-1">Model Parameters</legend>
                    <div>
                        <label htmlFor="model-select" className="block text-sm font-medium text-primary/80 mb-1">Model</label>
                        <select id="model-select" value={settings.model} onChange={e => handleSettingsChange('model', e.target.value)} className={commonInputClasses}>
                            {PROVIDERS[settings.provider].models.map(model => ( <option key={model} value={model}>{model}</option> ))}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="temperature" className="block text-sm font-medium text-primary/80 mb-1">Temperature: <span className="font-mono text-accent">{settings.temperature.toFixed(1)}</span></label>
                        <input id="temperature" type="range" min="0" max="1" step="0.1" value={settings.temperature} onChange={e => handleSettingsChange('temperature', parseFloat(e.target.value))} className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer" />
                        <div className="flex justify-between text-xs text-secondary mt-1"><span>Creative</span><span>Precise</span></div>
                    </div>
                     <div>
                        <label htmlFor="topP" className="block text-sm font-medium text-primary/80 mb-1">Top-P: <span className="font-mono text-accent">{settings.topP.toFixed(1)}</span></label>
                        <input id="topP" type="range" min="0" max="1" step="0.1" value={settings.topP} onChange={e => handleSettingsChange('topP', parseFloat(e.target.value))} className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer" />
                     </div>
                </fieldset>
            </div>
            <button
                onClick={onComplete}
                disabled={isNextDisabled}
                className="w-full mt-8 px-4 py-3 bg-accent text-background text-lg font-semibold rounded-lg hover:bg-accent-dark transition-colors focus:outline-none focus:ring-4 focus:ring-accent/50 disabled:bg-secondary disabled:cursor-not-allowed"
            >
                Next
            </button>
        </div>
        
        {/* Right Side: Model Guide */}
        <div className="bg-surface/50 p-8 rounded-lg border border-secondary/50 sticky top-10">
            <h2 className="text-2xl font-bold text-primary mb-3">{modelInfo.name}</h2>
            <p className="text-primary/80 mb-4">{modelInfo.description}</p>
            <div className="bg-accent/10 border-l-4 border-accent p-4 rounded-r-lg">
                <p className="font-semibold text-accent">{modelInfo.strengths}</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderSetupPage;