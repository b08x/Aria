
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import mermaid from 'mermaid';
import { Settings, Message, TTSPlayback, Role, Curriculum, SFLConfig, SavedDiagram, FileAttachment, ApiKeyStatus, SearchResults } from './types';
import { generateCurriculum, generateDiagramData, streamText, generateRelatedTopics, generateQuiz, generateLessonIntro, generateImage, fetchSearchResults } from './services/aiService';
import { playTTS, stopTTS } from './services/elevenLabsService';
import { INITIAL_SETTINGS, DEFAULT_SFL_CONFIG } from './constants';
import Sidebar from './components/Sidebar';
import ChatPanel from './components/ChatPanel';
import DiagramModal from './components/DiagramModal';
import LandingPage from './components/LandingPage';
import ProviderSetupPage from './components/ProviderSetupPage';
import SFLWizardPage from './components/SFLWizardPage';
import ResearchPanel from './components/ResearchPanel';

type Page = 'landing' | 'setupProvider' | 'setupSFL' | 'main';

const App: React.FC = () => {
  const [page, setPage] = useState<Page>('landing');

  // Playground State
  const [settings, setSettings] = useState<Settings>(INITIAL_SETTINGS);
  const [apiKeyStatus, setApiKeyStatus] = useState<Record<string, ApiKeyStatus>>({});
  const [ttsPlayback, setTtsPlayback] = useState<TTSPlayback>({ isPlaying: false, messageId: null, audio: null });

  // ARIA State
  const [sflConfig, setSflConfig] = useState<SFLConfig>(DEFAULT_SFL_CONFIG);
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null);
  const [savedDiagrams, setSavedDiagrams] = useState<SavedDiagram[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>('home');
  const [checkpoints, setCheckpoints] = useState<Record<string, Message[]>>({ 'home': [] });
  const [viewingDiagram, setViewingDiagram] = useState<SavedDiagram | null>(null);
  
  // Research Panel State
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  // Shared State
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<FileAttachment | null>(null);

  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, theme: 'dark', securityLevel: 'loose' });
  }, []);

  const messages = useMemo(() => {
    return checkpoints[currentSessionId || 'home'] || [];
  }, [checkpoints, currentSessionId]);
  
  const setMessages = useCallback((updater: React.SetStateAction<Message[]>) => {
    const sessionId = currentSessionId || 'home';
    setCheckpoints(prev => ({
      ...prev,
      [sessionId]: typeof updater === 'function' ? updater(prev[sessionId] || []) : updater,
    }));
  }, [currentSessionId]);

  const systemPrompt = useMemo(() => {
    let basePrompt = "You are ARIA, the Adaptive Research & Information Assistant. Your responses must be grounded using Google Search to provide accurate, up-to-date information. If the user uploads a file, analyze it and incorporate it into your response. When asked to elaborate, first ask a clarifying question to better tailor the information. Wrap this clarifying question in a markdown blockquote (e.g., '> What specifically would you like to know?'). DO NOT provide the full elaboration immediately.";
    if (sflConfig) {
        if (sflConfig.sflTenor.aiPersona) basePrompt += `\n- Your persona: ${sflConfig.sflTenor.aiPersona}.`;
        if (sflConfig.sflTenor.targetAudience) basePrompt += `\n- Tailor your language for: ${sflConfig.sflTenor.targetAudience}.`;
        if (sflConfig.sflMode.outputFormat) basePrompt += `\n- Format your response as: ${sflConfig.sflMode.outputFormat}.`;
    }
    const activeSection = curriculum?.sections.find(s => s.id === currentSessionId);
    if (activeSection) {
        basePrompt += `\n\n# CURRENT LESSON\nFocus your response exclusively on teaching the following topic: "${activeSection.title}".`;
    } else if (currentSessionId && currentSessionId !== 'home' && curriculum?.relatedTopics.includes(currentSessionId)) {
        basePrompt += `\n\n# CURRENT LESSON\nFocus your response exclusively on teaching the following related topic: "${currentSessionId}".`;
    }
    return basePrompt;
  }, [sflConfig, currentSessionId, curriculum]);

  const handleFetchSearch = useCallback(async (query: string) => {
    if (!settings.googleCseApiKey || !settings.googleCseId) {
        return; // Don't search if not configured
    }
    setIsSearching(true);
    setSearchError(null);
    setSearchResults(null);
    try {
        const results = await fetchSearchResults(query, settings.googleCseApiKey, settings.googleCseId);
        setSearchResults(results);
    } catch (e: any) {
        setSearchError(e.message);
    } finally {
        setIsSearching(false);
    }
  }, [settings.googleCseApiKey, settings.googleCseId]);

  const handleSFLWizardFinish = async (finalConfig: SFLConfig, topic: string) => {
    setSflConfig(finalConfig);
    setIsLoading(true);
    setPage('main');
    try {
      setLoadingMessage('Generating your personalized curriculum...');
      const sections = await generateCurriculum(topic, settings);
      setLoadingMessage('Discovering related topics for deeper learning...');
      const relatedTopics = await generateRelatedTopics(topic, settings);
      setCurriculum({ sections, relatedTopics });
       const initialMessage: Message = { id: Date.now().toString(), role: Role.ASSISTANT, content: `I've generated your personalized curriculum and found some related topics for **${topic}**. You can see them in the sidebar. Click any lesson to begin!` };
       setMessages(prev => [...prev, initialMessage]);
    } catch(e: any) {
        setError(`Initialization failed: ${e.message}`);
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
    }
  }

  const handleSendMessage = useCallback(async (prompt: string, isRetry = false) => {
    const finalPrompt = (isRetry && messages.length > 0) ? messages[messages.length - 1].content : prompt;
    if (!finalPrompt.trim()) return;
    
    setError(null);
    setIsLoading(true);
    stopTTS(ttsPlayback);
    setTtsPlayback({ isPlaying: false, messageId: null, audio: null });
    
    const userMessage: Message = { id: Date.now().toString(), role: Role.USER, content: finalPrompt, file: attachedFile || undefined };
    const currentMessages = isRetry ? messages.slice(0, -1) : [...messages, userMessage];
    setMessages(currentMessages);
    
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = { id: assistantMessageId, role: Role.ASSISTANT, content: '' };
    setMessages(prev => [...prev, assistantMessage]);
    setAttachedFile(null);

    try {
        const result = await streamText(settings, systemPrompt, currentMessages, attachedFile);

        let fullResponse = '';
        for await (const delta of result.textStream) {
            fullResponse += delta;
            setMessages(prev => prev.map(msg => msg.id === assistantMessageId ? { ...msg, content: fullResponse } : msg));
        }

        const finalResponse = result.getFinalResponse();
        const groundingMetadata = finalResponse?.candidates?.[0]?.groundingMetadata;

        if (groundingMetadata && groundingMetadata.groundingChunks && groundingMetadata.groundingChunks.length > 0) {
            setMessages(prev => prev.map(msg => msg.id === assistantMessageId ? { ...msg, groundingMetadata: groundingMetadata.groundingChunks as any[] } : msg));
        }
    } catch (e: any) {
        console.error(e);
        const errorMessage = e.message || 'An unknown error occurred.';
        setError(`API Error: ${errorMessage}`);
        setMessages(prev => prev.slice(0, -1));
    } finally {
        setIsLoading(false);
    }
  }, [messages, settings, systemPrompt, ttsPlayback, attachedFile, setMessages]);

  const handleGenerateDiagram = useCallback(async (text: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const { title, code } = await generateDiagramData(text, settings);
        const { svg } = await mermaid.render(`diag-${Date.now()}`, code);
        const pngDataUrl = `data:image/svg+xml;base64,${btoa(svg)}`;
        const newDiagram: SavedDiagram = { id: Date.now().toString(), title, pngDataUrl, sourceText: code };
        setSavedDiagrams(prev => [...prev, newDiagram]);
        const diagramMessage: Message = { id: Date.now().toString(), role: Role.ASSISTANT, content: `I've generated the "${title}" diagram and saved it to your workspace.` };
        setMessages(prev => [...prev, diagramMessage]);
      } catch (e: any) {
          setError(`Diagram Generation Failed: ${e.message}`);
      }
      setIsLoading(false);
  }, [settings, setMessages]);

  const handleGenerateImage = useCallback(async (prompt: string) => {
      setIsLoading(true);
      setLoadingMessage('Generating an image from your text...');
      setError(null);
      try {
          const imageUrl = await generateImage(prompt, settings);
          const imageMessage: Message = {
              id: Date.now().toString(),
              role: Role.ASSISTANT,
              content: `Here is an image I generated based on your request.`,
              image: { url: imageUrl, prompt: prompt }
          };
          setMessages(prev => [...prev, imageMessage]);
      } catch (e: any) {
          setError(`Image Generation Failed: ${e.message}`);
      } finally {
          setIsLoading(false);
          setLoadingMessage('');
      }
  }, [settings, setMessages]);
  
  const handleTakeQuiz = useCallback(async (moduleId: string) => {
    const module = curriculum?.sections.find(s => s.id === moduleId);
    if (!module) return;

    setError(null);
    setIsLoading(true);
    setLoadingMessage(`Generating a quiz for ${module.title}...`);

    try {
        const quizText = await generateQuiz(module.title, messages, settings);
        const quizMessage: Message = { id: Date.now().toString(), role: Role.ASSISTANT, content: `Here is a short quiz for **${module.title}**:\n\n${quizText}` };
        setMessages(prev => [...prev, quizMessage]);
    } catch(e: any) {
        setError(`Quiz Generation Failed: ${e.message}`);
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
    }
  }, [curriculum, messages, settings, setMessages]);


  const handleTTS = useCallback(async (message: Message) => {
    if (!settings.ttsEnabled || !settings.elevenLabsApiKey || !message.content) return;
    if (ttsPlayback.isPlaying && ttsPlayback.messageId === message.id) {
        stopTTS(ttsPlayback);
        setTtsPlayback({ isPlaying: false, messageId: null, audio: null });
    } else {
        stopTTS(ttsPlayback);
        try {
            setError(null);
            const audio = await playTTS(message.content, settings.elevenLabsVoiceId, settings.elevenLabsApiKey);
            audio.onended = () => setTtsPlayback({ isPlaying: false, messageId: null, audio: null });
            setTtsPlayback({ isPlaying: true, messageId: message.id, audio });
        } catch(e: any) {
            setError(`TTS Error: ${e.message}`);
            setTtsPlayback({ isPlaying: false, messageId: null, audio: null });
        }
    }
  }, [settings, ttsPlayback]);

  const handleStartNewLesson = async (sectionId: string, sectionTitle: string) => {
    setCurrentSessionId(sectionId);
    setSearchResults(null);
    setSearchError(null);
    
    // If we've already visited this lesson, just switch to it and search.
    if (checkpoints[sectionId] && checkpoints[sectionId].length > 0) {
      handleFetchSearch(sectionTitle);
      return;
    }

    // Handle home/scratchpad separately
    if (sectionId === 'home') {
       if (!checkpoints.home || checkpoints.home.length === 0) {
           setCheckpoints(prev => ({ ...prev, home: [] }));
       }
       return;
    }

    setIsLoading(true);
    setLoadingMessage(`Preparing your lesson on "${sectionTitle}"...`);
    setError(null);

    try {
        const introText = await generateLessonIntro(sectionTitle, settings);
        const introMessage: Message = {
            id: Date.now().toString(),
            role: Role.ASSISTANT,
            content: introText,
        };
        setCheckpoints(prev => ({
            ...prev,
            [sectionId]: [introMessage],
        }));
        handleFetchSearch(sectionTitle);
    } catch (e: any) {
        setError(`Failed to generate lesson introduction: ${e.message}`);
        setCurrentSessionId('home'); // Revert to home on error
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
    }
  };

  const onRetry = useCallback(() => {
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    if(lastUserMessage){
      handleSendMessage(lastUserMessage.content, true);
    }
  },[messages, handleSendMessage]);
  
  const renderPage = () => {
    switch(page) {
      case 'landing':
        return <LandingPage onStart={() => setPage('setupProvider')} />;
      case 'setupProvider':
        return <ProviderSetupPage 
                settings={settings} 
                setSettings={setSettings}
                apiKeyStatus={apiKeyStatus}
                setApiKeyStatus={setApiKeyStatus}
                onComplete={() => setPage('setupSFL')} 
               />;
      case 'setupSFL':
        return <SFLWizardPage onFinish={handleSFLWizardFinish} />;
      case 'main':
        const lessonTitle = curriculum?.sections.find(s => s.id === currentSessionId)?.title || (currentSessionId !== 'home' && curriculum?.relatedTopics.includes(currentSessionId!) ? currentSessionId : null);
        
        return (
          <div className="flex h-screen bg-background font-sans">
            <Sidebar
              settings={settings}
              setSettings={setSettings}
              apiKeyStatus={apiKeyStatus}
              curriculum={curriculum}
              currentSessionId={currentSessionId}
              onSectionClick={handleStartNewLesson}
              savedDiagrams={savedDiagrams}
              onViewDiagram={setViewingDiagram}
              onDeleteDiagram={(id) => setSavedDiagrams(prev => prev.filter(d => d.id !== id))}
              onTakeQuiz={handleTakeQuiz}
            />
            <ChatPanel
              messages={messages}
              isLoading={isLoading || !!loadingMessage}
              loadingMessage={loadingMessage}
              error={error}
              setError={setError}
              onSendMessage={handleSendMessage}
              onRetry={onRetry}
              onElaborate={(text) => handleSendMessage(`Tell me more about: ${text}`)}
              onGenerateDiagram={handleGenerateDiagram}
              onGenerateImage={handleGenerateImage}
              attachedFile={attachedFile}
              setAttachedFile={setAttachedFile}
              ttsSettings={{
                  enabled: settings.ttsEnabled,
                  onToggleTTS: handleTTS,
                  currentPlayingId: ttsPlayback.messageId
              }}
            />
            <ResearchPanel
                results={searchResults}
                isLoading={isSearching}
                error={searchError}
                currentSessionId={currentSessionId}
                lessonTitle={lessonTitle}
            />
            {viewingDiagram && (
              <DiagramModal
                  pngDataUrl={viewingDiagram.pngDataUrl}
                  title={viewingDiagram.title}
                  onClose={() => setViewingDiagram(null)}
              />
            )}
          </div>
        );
    }
  };

  return <>{renderPage()}</>;
};

export default App;