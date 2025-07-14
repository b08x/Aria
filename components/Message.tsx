import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message as MessageType, Role } from '../types';
import { UserIcon } from './icons/UserIcon';
import { BotIcon } from './icons/BotIcon';
import { PlayIcon } from './icons/PlayIcon';
import { StopIcon } from './icons/StopIcon';
import ParagraphMenu from './ParagraphMenu';
import { PaperclipIcon } from './icons/PaperclipIcon';

interface MessageProps {
  message: MessageType;
  isLastMessage: boolean;
  isLoading: boolean;
  onElaborate: (text: string) => void;
  onGenerateDiagram: (text: string) => void;
  onGenerateImage: (text: string) => void;
  ttsSettings: {
    enabled: boolean;
    onToggleTTS: (message: MessageType) => void;
    currentPlayingId: string | null;
  }
}

const Message: React.FC<MessageProps> = ({ message, isLastMessage, isLoading, onElaborate, onGenerateDiagram, onGenerateImage, ttsSettings }) => {
  const isUser = message.role === Role.USER;
  const Icon = isUser ? UserIcon : BotIcon;
  const isPlaying = ttsSettings.currentPlayingId === message.id;

  const containerClasses = isUser ? 'justify-end' : 'justify-start';
  const bubbleClasses = isUser ? 'bg-accent-dark/20' : 'bg-surface';
  const iconContainerClasses = 'bg-surface';
  const iconClasses = isUser ? 'text-primary' : 'text-accent';

  const RenderedContent = () => {
    if (message.content) {
      if (isUser) {
        return <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>;
      }
      // For assistant, render with paragraph menu. We assume one paragraph per message bubble.
      return (
        <div className="group relative">
            <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                <ParagraphMenu
                paragraphText={message.content}
                onElaborate={onElaborate}
                onGenerateDiagram={onGenerateDiagram}
                onGenerateImage={onGenerateImage}
                />
            </div>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
        </div>
      );
    }
    if (isLastMessage && isLoading) {
      return (
        <div className="flex items-center justify-center gap-1.5">
          <span className="w-2 h-2 bg-accent rounded-full animate-pulse" style={{animationDelay: '0s'}}></span>
          <span className="w-2 h-2 bg-accent rounded-full animate-pulse" style={{animationDelay: '0.15s'}}></span>
          <span className="w-2 h-2 bg-accent rounded-full animate-pulse" style={{animationDelay: '0.3s'}}></span>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className={`flex items-start gap-3 ${containerClasses} paragraph-container`}>
      {!isUser && (
        <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full ${iconContainerClasses}`}>
          <Icon className={`w-5 h-5 ${iconClasses}`} />
        </div>
      )}
      <div className={`group max-w-3xl w-fit`}>
        <div className={`p-4 rounded-xl ${bubbleClasses}`}>
          <div className="prose">
              <RenderedContent />
          </div>
          {message.image && (
            <div className="mt-4 border-t border-primary/20 pt-4">
                <img 
                    src={message.image.url} 
                    alt={message.image.prompt} 
                    className="rounded-lg max-w-full h-auto"
                />
            </div>
          )}
        </div>
         {message.files && message.files.length > 0 && (
            <div className="mt-2 space-y-1 max-w-xs">
              {message.files.map((file, index) => (
                <div key={index} className="p-2 text-sm text-primary bg-surface rounded-md border border-primary/20 flex items-center gap-2">
                  <PaperclipIcon className="w-4 h-4 text-accent flex-shrink-0"/>
                  <span className="truncate" title={file.name}>Attached: {file.name}</span>
                </div>
              ))}
            </div>
          )}
         {!isUser && ttsSettings.enabled && message.content && (
              <button
                onClick={() => ttsSettings.onToggleTTS(message)}
                className={`mt-2 flex items-center gap-2 text-xs px-2 py-1 rounded-md transition-colors ${isPlaying ? 'bg-accent text-background' : 'bg-muted/50 text-primary hover:bg-muted'}`}
              >
                {isPlaying ? <StopIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
                <span>{isPlaying ? 'Stop Audio' : 'Play Audio'}</span>
              </button>
         )}
      </div>
      {isUser && (
        <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full ${iconContainerClasses}`}>
          <Icon className={`w-5 h-5 ${iconClasses}`} />
        </div>
      )}
    </div>
  );
};

export default Message;