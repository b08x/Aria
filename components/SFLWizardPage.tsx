import React, { useState, useRef } from 'react';
import { SFLConfig, FileAttachment, Settings } from '../types';
import { DEFAULT_SFL_CONFIG, AI_PERSONAS, TARGET_AUDIENCES, DESIRED_TONES, OUTPUT_FORMATS, INTERPERSONAL_STANCES } from '../constants';
import { processFile } from '../utils';
import { generateTopicFromFiles } from '../services/aiService';
import { PaperclipIcon } from './icons/PaperclipIcon';
import { TrashIcon } from './icons/TrashIcon';

interface SFLWizardPageProps {
  onFinish: (config: SFLConfig, topic: string, files: FileAttachment[]) => void;
  onBack: () => void;
  settings: Settings;
}

const steps = [
  { id: 'topic', title: 'What do you want to learn about?' },
  { id: 'persona', title: "How should your assistant behave?" },
  { id: 'audience', title: "Who is this for?" },
  { id: 'tone', title: "What should the tone be?" },
  { id: 'stance', title: "What is the assistant's stance?" },
  { id: 'format', title: "How should responses be formatted?" },
  { id: 'review', title: "Review and Start Learning" },
];

const SFLWizardPage: React.FC<SFLWizardPageProps> = ({ onFinish, onBack, settings }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [sflConfig, setSflConfig] = useState<SFLConfig>(DEFAULT_SFL_CONFIG);
  const [topic, setTopic] = useState('');
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [isGeneratingTopic, setIsGeneratingTopic] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_FILES = 3;

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    } else {
      onBack();
    }
  };

  const handleNext = async () => {
    setError(null);
    if (currentStep === 0) { // Topic step
        if (!topic.trim() && files.length > 0) {
            setIsGeneratingTopic(true);
            try {
                const generatedTopic = await generateTopicFromFiles(files, settings);
                setTopic(generatedTopic);
                setCurrentStep(prev => prev + 1);
            } catch (e: any) {
                setError(`Failed to generate topic: ${e.message}`);
            } finally {
                setIsGeneratingTopic(false);
            }
        } else {
             setCurrentStep(prev => prev + 1);
        }
    } else {
        setCurrentStep(prev => prev + 1);
    }
  };

  const handleFinish = () => {
    const finalConfig = {...sflConfig, sflField: {...sflConfig.sflField, topic }};
    onFinish(finalConfig, topic, files);
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputFiles = e.target.files;
      if (inputFiles) {
        const remainingSlots = MAX_FILES - files.length;
        // Fix: Cast Array.from(inputFiles) to File[] as TypeScript was incorrectly inferring it as unknown[].
        const filesToProcess: File[] = (Array.from(inputFiles) as File[]).slice(0, remainingSlots);

        const newAttachments = [...files];

        for (const file of filesToProcess) {
            try {
                const attachment = await processFile(file);
                newAttachments.push(attachment);
            } catch (err: any) {
                console.error(`Error processing file ${file.name}:`, err);
                setError(`Error processing "${file.name}": ${err.message}`);
            }
        }
        setFiles(newAttachments);
      }
      e.target.value = ''; // Reset file input
  };
  
  const removeFile = (fileName: string) => {
    setFiles(files.filter(f => f.name !== fileName));
  };


  const renderStepContent = () => {
    switch (steps[currentStep].id) {
      case 'topic':
        return (
            <div className="w-full max-w-lg space-y-6">
                <input
                    type="text"
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    placeholder="Type a topic, or upload files to generate one"
                    className="w-full p-4 text-xl bg-surface border-2 border-muted rounded-lg focus:outline-none focus:ring-4 focus:ring-accent/50 transition placeholder-secondary"
                />

                <div className="flex items-center gap-4">
                    <hr className="flex-grow border-muted"/>
                    <span className="text-secondary text-sm">OR</span>
                    <hr className="flex-grow border-muted"/>
                </div>
                
                <div className="space-y-3">
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        className="hidden" 
                        accept=".md,.txt,.csv,.pdf,.docx"
                        multiple
                        disabled={files.length >= MAX_FILES}
                    />
                     <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={files.length >= MAX_FILES}
                        className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-surface border-2 border-dashed border-muted text-primary font-semibold rounded-lg hover:border-accent hover:text-accent disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        <PaperclipIcon className="w-5 h-5"/>
                        Upload Documents ({files.length}/{MAX_FILES})
                    </button>
                    {files.length > 0 && (
                        <div className="space-y-2 pt-2">
                            {files.map((file) => (
                                <div key={file.name} className="flex items-center justify-between gap-2 p-2 text-sm text-primary bg-surface rounded-md border border-muted">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <PaperclipIcon className="w-4 h-4 text-accent flex-shrink-0" />
                                        <span className="truncate" title={file.name}>{file.name}</span>
                                    </div>
                                    <button
                                        onClick={() => removeFile(file.name)}
                                        className="text-secondary hover:text-red-300 ml-2 p-1 rounded-full flex-shrink-0"
                                        aria-label={`Remove ${file.name}`}
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        );
      case 'persona':
        return <OptionSelector
                    options={AI_PERSONAS}
                    value={sflConfig.sflTenor.aiPersona || ''}
                    onValueChange={value => setSflConfig(p => ({...p, sflTenor: {...p.sflTenor, aiPersona: value}}))}
                    placeholder="e.g., A patient history professor"
                />;
      case 'audience':
        return <OptionSelector
                    options={TARGET_AUDIENCES}
                    value={sflConfig.sflTenor.targetAudience || ''}
                    onValueChange={value => setSflConfig(p => ({...p, sflTenor: {...p.sflTenor, targetAudience: value}}))}
                    placeholder="e.g., A group of marketing executives"
                />;
      case 'tone':
        return <OptionSelector
                    options={DESIRED_TONES}
                    value={sflConfig.sflTenor.desiredTone || ''}
                    onValueChange={value => setSflConfig(p => ({...p, sflTenor: {...p.sflTenor, desiredTone: value}}))}
                    placeholder="e.g., Professional yet witty"
                />;
      case 'stance':
        return <OptionSelector
                    options={INTERPERSONAL_STANCES}
                    value={sflConfig.sflTenor.interpersonalStance || ''}
                    onValueChange={value => setSflConfig(p => ({...p, sflTenor: {...p.sflTenor, interpersonalStance: value}}))}
                    placeholder="e.g., A partner in discovery"
                />;
      case 'format':
        return <OptionSelector
                    options={OUTPUT_FORMATS}
                    value={sflConfig.sflMode.outputFormat || ''}
                    onValueChange={value => setSflConfig(p => ({...p, sflMode: {...p.sflMode, outputFormat: value}}))}
                    placeholder="e.g., A JSON object with 'key' and 'value'"
                />;
      case 'review':
        return <ReviewStep config={sflConfig} topic={topic} />;
      default:
        return null;
    }
  };
  
  const isNextDisabled = steps[currentStep].id === 'topic' && !topic.trim() && files.length === 0;

  return (
    <div className="min-h-screen bg-background text-primary flex flex-col items-center justify-center p-4 transition-all duration-500">
      <div className="max-w-3xl w-full text-center">
        <div className="mb-4 h-16">
            <h1 className="text-4xl font-bold transition-opacity duration-300 text-accent">{steps[currentStep].title}</h1>
            {currentStep > 0 && topic && (
                <p className="text-secondary text-lg">for: {topic}</p>
            )}
        </div>
        <p className="text-secondary mb-8">Step {currentStep + 1} of {steps.length}</p>
        
        {error && (
            <div className="p-3 mb-4 text-sm text-center text-red-300 bg-red-600/30 rounded-md">
                <p>{error}</p>
            </div>
        )}

        <div className="min-h-48 mb-10 flex items-center justify-center">
            {isGeneratingTopic ? (
                <div className="flex flex-col items-center gap-4 text-secondary">
                    <div className="w-8 h-8 border-4 border-t-transparent border-accent rounded-full animate-spin"></div>
                    <p>Analyzing documents and generating topic...</p>
                </div>
            ) : renderStepContent() }
        </div>

        <div className="flex justify-between items-center w-full">
            <button 
                onClick={handleBack} 
                disabled={isGeneratingTopic}
                className="px-6 py-3 bg-muted/50 text-primary font-semibold rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Back
            </button>
            {currentStep < steps.length - 1 ? (
                 <button 
                    onClick={handleNext} 
                    disabled={isNextDisabled || isGeneratingTopic}
                    className="px-6 py-3 bg-accent-dark text-background font-semibold rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next
                </button>
            ) : (
                <button 
                    onClick={handleFinish}
                    className="px-6 py-3 bg-accent-dark text-background font-semibold rounded-lg hover:bg-accent"
                >
                    Generate & Start Learning
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

const OptionSelector: React.FC<{
  options: readonly string[],
  value?: string,
  onValueChange: (value: string) => void,
  placeholder: string,
}> = ({ options, value, onValueChange, placeholder }) => (
    <div className="w-full max-w-lg space-y-6">
      <input
        type="text"
        value={value}
        onChange={e => onValueChange(e.target.value)}
        placeholder={placeholder}
        className="w-full p-4 text-xl bg-surface border-2 border-muted rounded-lg focus:outline-none focus:ring-4 focus:ring-accent/50 transition placeholder-secondary"
      />
      <div className="flex items-center gap-4">
          <hr className="flex-grow border-muted"/>
          <span className="text-secondary text-sm uppercase">Or Select a Suggestion</span>
          <hr className="flex-grow border-muted"/>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {options.map(option => (
              <button
                  key={option}
                  onClick={() => onValueChange(option)}
                  className={`p-4 rounded-lg border-2 transition-colors h-full ${value === option ? 'bg-accent/20 border-accent' : 'bg-surface border-muted hover:border-accent/50'}`}
              >
                  <span className="text-lg font-medium text-primary">{option}</span>
              </button>
          ))}
      </div>
    </div>
);

const ReviewStep: React.FC<{config: SFLConfig, topic: string}> = ({ config, topic }) => (
    <div className="text-left bg-surface border border-muted p-6 rounded-lg max-w-md mx-auto space-y-3">
        <p className="text-primary"><strong>Topic:</strong> <span className="text-accent">{topic || '(To be generated from files)'}</span></p>
        <p className="text-primary"><strong>Tutor Persona:</strong> <span className="text-accent">{config.sflTenor.aiPersona}</span></p>
        <p className="text-primary"><strong>For:</strong> <span className="text-accent">{config.sflTenor.targetAudience}</span></p>
        <p className="text-primary"><strong>Tone:</strong> <span className="text-accent">{config.sflTenor.desiredTone}</span></p>
        <p className="text-primary"><strong>Stance:</strong> <span className="text-accent">{config.sflTenor.interpersonalStance}</span></p>
        <p className="text-primary"><strong>Format:</strong> <span className="text-accent">{config.sflMode.outputFormat}</span></p>
    </div>
);

export default SFLWizardPage;