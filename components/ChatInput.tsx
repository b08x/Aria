
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SendIcon } from './icons/SendIcon';
import { PaperclipIcon } from './icons/PaperclipIcon';
import { Command, commands } from '../commands';
import AutoCompletePopup from './AutoCompletePopup';
import { FileAttachment } from '../types';
import { processFile } from '../utils';
import { TrashIcon } from './icons/TrashIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';

// Fix: Add types for Web Speech API, which are not standard in TypeScript.
declare global {
  interface Window {
    SpeechRecognition: { new (): SpeechRecognition };
    webkitSpeechRecognition: { new (): SpeechRecognition };
  }
}

interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
}


interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  attachedFiles: FileAttachment[];
  setAttachedFiles: (files: FileAttachment[]) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, attachedFiles, setAttachedFiles }) => {
  const [input, setInput] = useState('');
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const [filteredCommands, setFilteredCommands] = useState<Command[]>(commands);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  // New state for voice input
  const [isListening, setIsListening] = useState(false);
  const [isSpeechRecognitionSupported, setIsSpeechRecognitionSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_FILES = 3;

  // Effect for speech recognition setup
  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      setIsSpeechRecognitionSupported(true);
      const recognition: SpeechRecognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        setInput(transcript);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []); // Run only once

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${scrollHeight}px`;
    }
  }, [input]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);

    if (value.startsWith('/')) {
        const searchTerm = value.substring(1);
        const newFilteredCommands = commands.filter(cmd => cmd.name.toLowerCase().includes(searchTerm.toLowerCase()));
        setFilteredCommands(newFilteredCommands);
        setSelectedIndex(0);
        setIsAutocompleteOpen(newFilteredCommands.length > 0);
    } else {
        setIsAutocompleteOpen(false);
    }
  };

  const selectCommand = useCallback((cmd: Command) => {
    setInput(`${cmd.name} ${cmd.placeholder || ''}`);
    setIsAutocompleteOpen(false);
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || attachedFiles.length > 0) && !isLoading) {
      if (isListening) {
        recognitionRef.current?.stop();
      }
      onSendMessage(input);
      setInput('');
      // Files are cleared in App.tsx after sending
      setIsAutocompleteOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isAutocompleteOpen) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        selectCommand(filteredCommands[selectedIndex]);
      } else if (e.key === 'Tab') {
          e.preventDefault();
          selectCommand(filteredCommands[selectedIndex]);
      } else if (e.key === 'Escape') {
        setIsAutocompleteOpen(false);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files) {
        const remainingSlots = MAX_FILES - attachedFiles.length;
        // Fix: Cast Array.from(files) to File[] as TypeScript was incorrectly inferring it as unknown[].
        const filesToProcess: File[] = (Array.from(files) as File[]).slice(0, remainingSlots);

        const newAttachments: FileAttachment[] = [...attachedFiles];

        for (const file of filesToProcess) {
            try {
                const attachment = await processFile(file);
                newAttachments.push(attachment);
            } catch (error: any) {
                console.error(`Error processing file ${file.name}:`, error.message);
            }
        }
        setAttachedFiles(newAttachments);
      }
      e.target.value = ''; // Reset file input
  };
  
  const removeFile = (fileName: string) => {
    setAttachedFiles(attachedFiles.filter(f => f.name !== fileName));
  };

  const handleToggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setInput(''); // Clear input before starting
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  return (
    <div className="relative">
      {isAutocompleteOpen && (
          <AutoCompletePopup
              commands={filteredCommands}
              onSelect={selectCommand}
              selectedIndex={selectedIndex}
          />
      )}
      <form onSubmit={handleSubmit} className="flex items-end space-x-3">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
          accept=".md,.txt,.csv,.pdf,.docx"
          multiple
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading || attachedFiles.length >= MAX_FILES}
          className="self-end flex-shrink-0 flex items-center justify-center w-12 h-12 bg-surface border border-muted rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted/20 transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
          aria-label="Attach file"
        >
          <PaperclipIcon className="w-6 h-6 text-primary" />
        </button>
        <div className="flex-1">
            {attachedFiles.length > 0 && (
                <div className="mb-2 space-y-2">
                    {attachedFiles.map((file) => (
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
            <div className="relative">
                <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? "Listening..." : "Type a message or / for commands..."}
                rows={1}
                className="w-full p-3 pr-4 text-primary bg-surface border border-muted rounded-lg resize-none focus:ring-2 focus:ring-accent focus:outline-none custom-scrollbar placeholder-secondary"
                style={{ maxHeight: '200px' }}
                disabled={isLoading}
                />
            </div>
        </div>
        <button
          type="button"
          onClick={handleToggleListening}
          disabled={isLoading || !isSpeechRecognitionSupported}
          className={`self-end flex-shrink-0 flex items-center justify-center w-12 h-12 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-accent ${
            isListening
              ? 'bg-red-600/30 border-red-500 animate-pulse-sm'
              : 'bg-surface border-muted hover:bg-muted/20'
          }`}
          aria-label={isListening ? 'Stop listening' : 'Start voice input'}
          title={isSpeechRecognitionSupported ? (isListening ? 'Stop listening' : 'Start voice input') : 'Voice input not supported'}
        >
          <MicrophoneIcon className={`w-6 h-6 ${isListening ? 'text-red-300' : 'text-primary'}`} />
        </button>
        <button
            type="submit"
            disabled={isLoading || (!input.trim() && attachedFiles.length === 0)}
            className="self-end flex items-center justify-center w-12 h-12 bg-accent-dark rounded-lg disabled:bg-muted disabled:cursor-not-allowed hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
            aria-label="Send message"
        >
            {isLoading ? (
            <div className="w-5 h-5 border-2 border-t-transparent border-background rounded-full animate-spin"></div>
            ) : (
            <SendIcon className="w-6 h-6 text-background" />
            )}
        </button>
      </form>
    </div>
  );
};

export default ChatInput;