
import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Message as MessageType, Role } from '../types';
import { UserIcon } from './icons/UserIcon';
import { BotIcon } from './icons/BotIcon';
import { PlayIcon } from './icons/PlayIcon';
import { StopIcon } from './icons/StopIcon';
import ParagraphMenu from './ParagraphMenu';
import { PaperclipIcon } from './icons/PaperclipIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ArrowRightCircleIcon } from './icons/ArrowRightCircleIcon';
import { GlobeAltIcon } from './icons/GlobeAltIcon';

interface MessageProps {
  message: MessageType;
  isLoading: boolean;
  onElaborate: (text: string) => void;
  onGenerateDiagram: (text: string) => void;
  onGenerateImage: (text: string) => void;
  onSubtopicClick: (subtopic: string) => void;
  onContinue?: () => void;
  ttsSettings: {
    enabled: boolean;
    onToggleTTS: (message: MessageType) => void;
    currentPlayingId: string | null;
  }
}

const Message: React.FC<MessageProps> = ({ message, isLoading, onElaborate, onGenerateDiagram, onGenerateImage, onSubtopicClick, onContinue, ttsSettings }) => {
  const isUser = message.role === Role.USER;
  const Icon = isUser ? UserIcon : BotIcon;
  const isPlaying = ttsSettings.currentPlayingId === message.id;

  const hasGrounding = !isUser && message.groundingMetadata && message.groundingMetadata.length > 0;

  const processedContent = useMemo(() => {
    if (!hasGrounding) {
      return message.content;
    }
    let citationIndex = 0;
    return message.content.replace(/\[i\]/g, () => {
      citationIndex++;
      const source = message.groundingMetadata?.[citationIndex - 1];
      if (source?.web?.uri) {
        return `<sup><a href="${source.web.uri}" target="_blank" rel="noopener noreferrer" title="${source.web.title}" class="font-medium no-underline text-link-blue">[${citationIndex}]</a></sup>`;
      }
      return `<sup>[${citationIndex}]</sup>`; // Fallback if source is malformed
    });
  }, [message.content, message.groundingMetadata, hasGrounding]);
  
  const contentToShow = hasGrounding ? processedContent : message.content;
  const originalContentForActions = message.content;

  const containerClasses = isUser ? 'justify-end' : 'justify-start';
  const bubbleClasses = isUser ? 'bg-accent-dark' : 'bg-surface';
  const iconContainerClasses = 'bg-surface';
  const iconClasses = isUser ? 'text-primary' : 'text-accent';

  const RenderedContent = () => {
    if (contentToShow) {
        if (isUser) {
            return <ReactMarkdown remarkPlugins={[remarkGfm]}>{contentToShow}</ReactMarkdown>;
        }
        // For assistant, render with paragraph menu.
        return (
            <div className="group relative">
                <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                    <ParagraphMenu
                    paragraphText={originalContentForActions}
                    onElaborate={onElaborate}
                    onGenerateDiagram={onGenerateDiagram}
                    onGenerateImage={onGenerateImage}
                    />
                </div>
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{contentToShow}</ReactMarkdown>
            </div>
        );
    }
    if (isLoading) {
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
          <div className="prose text-primary min-h-[1em]">
              <RenderedContent />
          </div>

          {hasGrounding && (
            <div className="mt-4 pt-3 border-t border-muted/50">
              <h4 className="flex items-center gap-2 font-semibold text-sm text-secondary mb-2">
                <GlobeAltIcon className="w-4 h-4" />
                Sources
              </h4>
              <ol className="list-decimal list-inside text-sm space-y-1 prose">
                {message.groundingMetadata?.map((source, index) => (
                  <li key={index} className="text-primary/90 p-0 m-0 border-none">
                    <a 
                      href={source.web.uri} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      title={source.web.title}
                      className="text-link-blue hover:underline"
                    >
                      {source.web.title}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {message.subtopics && message.subtopics.length > 0 && (
            <div className="mt-4 pt-4 border-t border-muted/50">
              <h3 className="font-semibold text-primary mb-3 prose">What to Expect</h3>
              <div className="space-y-2">
                {message.subtopics.map((subtopic, index) => (
                  <button
                    key={index}
                    onClick={() => onSubtopicClick(subtopic.text)}
                    disabled={subtopic.completed}
                    className="w-full text-left flex items-center gap-3 p-3 rounded-lg transition-colors border border-muted disabled:cursor-not-allowed group hover:bg-accent/20 hover:border-accent disabled:bg-surface/50 disabled:border-muted"
                  >
                    {subtopic.completed ? (
                      <CheckCircleIcon className="w-6 h-6 text-green-400 flex-shrink-0" />
                    ) : (
                      <ArrowRightCircleIcon className="w-6 h-6 text-secondary flex-shrink-0 transition-colors group-hover:text-accent" />
                    )}
                    <span className={`flex-1 ${subtopic.completed ? 'text-secondary line-through' : 'text-primary'}`}>{subtopic.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {message.image && (
            <div className="mt-4 border-t border-muted/50 pt-4">
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
                <div key={index} className="p-2 text-sm text-primary bg-surface rounded-md border border-muted flex items-center gap-2">
                  <PaperclipIcon className="w-4 h-4 text-accent flex-shrink-0"/>
                  <span className="truncate" title={file.name}>Attached: {file.name}</span>
                </div>
              ))}
            </div>
          )}

        {onContinue && !isLoading && (
            <div className="mt-4 flex justify-start">
                <button
                    onClick={onContinue}
                    className="px-5 py-2 bg-accent-dark text-background text-sm font-semibold rounded-lg hover:bg-accent transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-accent/50"
                >
                    Continue
                </button>
            </div>
        )}

         {!isUser && ttsSettings.enabled && originalContentForActions && (
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

// Add new icon
const GlobeAltIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
);
  
export default Message;