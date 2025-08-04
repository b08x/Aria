
import React, { useEffect, useRef } from 'react';
import { Message as MessageType, Role } from '../types';
import Message from './Message';
import { BotIcon } from './icons/BotIcon';

interface MessageListProps {
  messages: MessageType[];
  isLoading: boolean;
  loadingMessage?: string;
  error: string | null;
  onRetry: () => void;
  onElaborate: (text: string) => void;
  onGenerateDiagram: (text: string) => void;
  onGenerateImage: (text: string) => void;
  onSubtopicClick: (subtopic: string) => void;
  onContinue: () => void;
  ttsSettings: {
    enabled: boolean;
    onToggleTTS: (message: MessageType) => void;
    currentPlayingId: string | null;
  }
}

const MessageList: React.FC<MessageListProps> = ({ messages, isLoading, loadingMessage, error, onRetry, onElaborate, onGenerateDiagram, onGenerateImage, onSubtopicClick, onContinue, ttsSettings }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const showLoadingIndicator = isLoading && !!loadingMessage;

  return (
    <div className="p-4 space-y-6 flex-1">
      {messages.map((msg, index) => {
        const isLastAssistantMessage = msg.role === Role.ASSISTANT && index === messages.length - 1 && !isLoading && !!msg.content;

        return (
          <Message 
            key={msg.id} 
            message={msg}
            isLoading={isLoading && messages[messages.length - 1].id === msg.id}
            onElaborate={onElaborate}
            onGenerateDiagram={onGenerateDiagram}
            onGenerateImage={onGenerateImage}
            onSubtopicClick={onSubtopicClick}
            onContinue={isLastAssistantMessage ? onContinue : undefined}
            ttsSettings={ttsSettings}
          />
        )
      })}
       {error && (
        <div className="flex justify-center">
            <button
                onClick={onRetry}
                className="px-4 py-2 text-sm font-medium text-background bg-accent-dark rounded-md hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent focus:ring-offset-surface"
            >
                Retry Last Message
            </button>
        </div>
       )}
       {showLoadingIndicator && (
            <div className="flex items-start gap-3 justify-start">
                 <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-surface">
                    <BotIcon className="w-5 h-5 text-accent" />
                </div>
                <div className="bg-surface p-4 rounded-xl">
                   <p className="text-primary animate-pulse">{loadingMessage}</p>
                </div>
            </div>
       )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;