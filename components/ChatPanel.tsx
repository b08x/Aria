
import React from 'react';
import { Message as MessageType, FileAttachment } from '../types';
import ChatInput from './ChatInput';
import MessageList from './MessageList';
import { BotIcon } from './icons/BotIcon';

interface ChatPanelProps {
  messages: MessageType[];
  isLoading: boolean;
  loadingMessage?: string;
  error: string | null;
  setError: (error: string | null) => void;
  onSendMessage: (prompt: string) => void;
  onRetry: () => void;
  onElaborate: (text: string) => void;
  onGenerateDiagram: (text: string) => void;
  onGenerateImage: (text: string) => void;
  onSubtopicClick: (subtopic: string) => void;
  onContinue: () => void;
  attachedFiles: FileAttachment[];
  setAttachedFiles: (files: FileAttachment[]) => void;
  ttsSettings: {
    enabled: boolean;
    onToggleTTS: (message: MessageType) => void;
    currentPlayingId: string | null;
    currentLoadingId: string | null;
  }
}

const ChatPanel: React.FC<ChatPanelProps> = ({ 
    messages, 
    isLoading, 
    loadingMessage,
    error, 
    setError, 
    onSendMessage, 
    onRetry,
    onElaborate,
    onGenerateDiagram,
    onGenerateImage,
    onSubtopicClick,
    onContinue,
    attachedFiles,
    setAttachedFiles,
    ttsSettings,
}) => {
  return (
    <main className="flex flex-1 flex-col h-screen">
      <header className="flex items-center p-4 border-b border-muted shadow-md bg-surface/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center">
          <BotIcon className="w-8 h-8 mr-3 text-accent" />
          <h1 className="text-2xl font-bold text-primary">ARIA</h1>
        </div>
      </header>

      <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
         {messages.length > 0 || isLoading || loadingMessage ? (
            <MessageList 
                messages={messages} 
                isLoading={isLoading} 
                loadingMessage={loadingMessage}
                error={error} 
                onRetry={onRetry}
                onElaborate={onElaborate}
                onGenerateDiagram={onGenerateDiagram}
                onGenerateImage={onGenerateImage}
                onSubtopicClick={onSubtopicClick}
                onContinue={onContinue}
                ttsSettings={ttsSettings}
            />
        ) : (
            <div className="flex flex-col items-center justify-center h-full text-secondary p-8">
                <div className="text-center">
                    <h2 className="text-2xl font-semibold text-primary mb-4">Ready to Learn?</h2>
                    <p className="max-w-md mx-auto mb-8">
                        Your personalized lesson plan is in the sidebar. Click a topic to start, or just ask a question!
                    </p>
                </div>
            </div>
        )}
      </div>

      <footer className="p-4 border-t border-muted bg-background">
        {error && (
            <div className="p-3 mb-3 text-sm text-center text-red-300 bg-red-600/30 rounded-md">
                <p>
                    <strong>Error:</strong> {error}
                    <button onClick={() => setError(null)} className="ml-4 font-bold text-red-200 hover:text-red-100">Close</button>
                </p>
            </div>
        )}
        <ChatInput 
            onSendMessage={onSendMessage} 
            isLoading={isLoading}
            attachedFiles={attachedFiles}
            setAttachedFiles={setAttachedFiles}
        />
        <p className="text-xs text-center text-secondary mt-2">
            AI responses are grounded with Google Search and may be inaccurate. Verify important information.
        </p>
      </footer>
    </main>
  );
};

export default ChatPanel;
