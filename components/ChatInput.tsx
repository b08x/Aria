
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SendIcon } from './icons/SendIcon';
import { PaperclipIcon } from './icons/PaperclipIcon';
import { Command, commands } from '../commands';
import AutoCompletePopup from './AutoCompletePopup';
import { FileAttachment } from '../types';
import { fileToBase64 } from '../utils';
import { TrashIcon } from './icons/TrashIcon';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  attachedFile: FileAttachment | null;
  setAttachedFile: (file: FileAttachment | null) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, attachedFile, setAttachedFile }) => {
  const [input, setInput] = useState('');
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const [filteredCommands, setFilteredCommands] = useState<Command[]>(commands);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
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
      const file = e.target.files?.[0];
      if (file) {
          const base64Data = await fileToBase64(file);
          setAttachedFile({
              name: file.name,
              type: file.type,
              base64Data: base64Data
          });
      }
      e.target.value = ''; // Reset file input
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
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,application/pdf,.txt,.md"/>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading || !!attachedFile}
          className="self-end flex-shrink-0 flex items-center justify-center w-12 h-12 bg-surface border border-secondary/50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary/50 transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
          aria-label="Attach file"
        >
          <PaperclipIcon className="w-6 h-6 text-primary" />
        </button>
        <div className="flex-1">
            {attachedFile && (
                 <div className="flex items-center justify-between gap-2 p-2 mb-2 text-sm text-primary bg-background/50 rounded-md border border-secondary/50">
                    <div className="flex items-center gap-2 min-w-0">
                        <PaperclipIcon className="w-4 h-4 text-accent flex-shrink-0" />
                        <span className="truncate" title={attachedFile.name}>{attachedFile.name}</span>
                    </div>
                    <button
                        onClick={() => setAttachedFile(null)}
                        className="text-secondary hover:text-red-400 ml-2 p-1 rounded-full flex-shrink-0"
                        aria-label={`Remove ${attachedFile.name}`}
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            )}
            <div className="relative">
                <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type a message or / for commands..."
                rows={1}
                className="w-full p-3 pr-4 text-primary bg-background border border-secondary/50 rounded-lg resize-none focus:ring-2 focus:ring-accent focus:outline-none custom-scrollbar"
                style={{ maxHeight: '200px' }}
                disabled={isLoading}
                />
            </div>
        </div>
        <button
            type="submit"
            disabled={isLoading || (!input.trim() && !attachedFile)}
            className="self-end flex items-center justify-center w-12 h-12 bg-accent rounded-lg disabled:bg-secondary disabled:cursor-not-allowed hover:bg-accent-dark transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
            aria-label="Send message"
        >
            {isLoading ? (
            <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
            ) : (
            <SendIcon className="w-6 h-6 text-background" />
            )}
        </button>
      </form>
    </div>
  );
};

export default ChatInput;
