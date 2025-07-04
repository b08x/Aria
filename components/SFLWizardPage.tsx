
import React, { useState } from 'react';
import { SFLConfig } from '../types';
import { DEFAULT_SFL_CONFIG, AI_PERSONAS, TARGET_AUDIENCES, DESIRED_TONES, OUTPUT_FORMATS } from '../constants';

interface SFLWizardPageProps {
  onFinish: (config: SFLConfig, topic: string) => void;
}

const steps = [
  { id: 'topic', title: 'What do you want to learn about?' },
  { id: 'persona', title: "How should your assistant behave?" },
  { id: 'audience', title: "Who is this for?" },
  { id: 'tone', title: "What should the tone be?" },
  { id: 'format', title: "How should responses be formatted?" },
  { id: 'review', title: "Review and Start Learning" },
];

const SFLWizardPage: React.FC<SFLWizardPageProps> = ({ onFinish }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [sflConfig, setSflConfig] = useState<SFLConfig>(DEFAULT_SFL_CONFIG);
  const [topic, setTopic] = useState('');

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const handleFinish = () => {
    const finalConfig = {...sflConfig, sflField: {...sflConfig.sflField, topic }};
    onFinish(finalConfig, topic);
  };
  
  const renderStepContent = () => {
    switch (steps[currentStep].id) {
      case 'topic':
        return (
            <input
                type="text"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g., The History of Ancient Rome"
                className="w-full max-w-lg p-4 text-xl bg-surface border-2 border-secondary/50 rounded-lg focus:outline-none focus:ring-4 focus:ring-accent/50"
            />
        );
      case 'persona':
        return <OptionSelector options={AI_PERSONAS} selected={sflConfig.sflTenor.aiPersona} onSelect={value => setSflConfig(p => ({...p, sflTenor: {...p.sflTenor, aiPersona: value}}))} />;
      case 'audience':
        return <OptionSelector options={TARGET_AUDIENCES} selected={sflConfig.sflTenor.targetAudience} onSelect={value => setSflConfig(p => ({...p, sflTenor: {...p.sflTenor, targetAudience: value}}))} />;
      case 'tone':
        return <OptionSelector options={DESIRED_TONES} selected={sflConfig.sflTenor.desiredTone} onSelect={value => setSflConfig(p => ({...p, sflTenor: {...p.sflTenor, desiredTone: value}}))} />;
      case 'format':
        return <OptionSelector options={OUTPUT_FORMATS} selected={sflConfig.sflMode.outputFormat} onSelect={value => setSflConfig(p => ({...p, sflMode: {...p.sflMode, outputFormat: value}}))} />;
      case 'review':
        return <ReviewStep config={sflConfig} topic={topic} />;
      default:
        return null;
    }
  };
  
  const isNextDisabled = steps[currentStep].id === 'topic' && !topic.trim();

  return (
    <div className="min-h-screen bg-background text-primary flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl w-full text-center">
        <h1 className="text-4xl font-bold mb-4">{steps[currentStep].title}</h1>
        <p className="text-secondary mb-10">Step {currentStep + 1} of {steps.length}</p>
        
        <div className="min-h-48 mb-10 flex items-center justify-center">
            {renderStepContent()}
        </div>

        <div className="flex justify-between items-center w-full">
            <button 
                onClick={prevStep} 
                disabled={currentStep === 0}
                className="px-6 py-3 bg-secondary/50 text-primary font-semibold rounded-lg hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Back
            </button>
            {currentStep < steps.length - 1 ? (
                 <button 
                    onClick={nextStep} 
                    disabled={isNextDisabled}
                    className="px-6 py-3 bg-accent text-background font-semibold rounded-lg hover:bg-accent-dark disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next
                </button>
            ) : (
                <button 
                    onClick={handleFinish}
                    className="px-6 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600"
                >
                    Generate & Start Learning
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

const OptionSelector: React.FC<{options: readonly string[], selected?: string, onSelect: (value: string) => void}> = ({ options, selected, onSelect }) => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {options.map(option => (
            <button
                key={option}
                onClick={() => onSelect(option)}
                className={`p-6 rounded-lg border-2 transition-colors ${selected === option ? 'bg-accent/20 border-accent' : 'bg-surface/50 border-secondary/50 hover:border-primary/50'}`}
            >
                <span className="text-lg font-medium">{option}</span>
            </button>
        ))}
    </div>
);

const ReviewStep: React.FC<{config: SFLConfig, topic: string}> = ({ config, topic }) => (
    <div className="text-left bg-surface/50 border border-secondary/50 p-6 rounded-lg max-w-md mx-auto space-y-3">
        <p><strong>Topic:</strong> <span className="text-accent">{topic}</span></p>
        <p><strong>Tutor Persona:</strong> <span className="text-accent">{config.sflTenor.aiPersona}</span></p>
        <p><strong>For:</strong> <span className="text-accent">{config.sflTenor.targetAudience}</span></p>
        <p><strong>Tone:</strong> <span className="text-accent">{config.sflTenor.desiredTone}</span></p>
        <p><strong>Format:</strong> <span className="text-accent">{config.sflMode.outputFormat}</span></p>
    </div>
);

export default SFLWizardPage;