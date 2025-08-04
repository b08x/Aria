
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import mermaid from 'mermaid';
import { Settings, Message, TTSPlayback, Role, Curriculum, SFLConfig, SavedDiagram, FileAttachment, ApiKeyStatus, SearchResults, Provider } from './types';
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
  const [ttsPlayback, setTtsPlayback] = useState<TTSPlayback>({ isPlaying: false, isLoading: false, messageId: null, audio: null });
  const [dynamicModels, setDynamicModels] = useState<Record<string, string[]>>({});

  // ARIA State
  const [sflConfig, setSflConfig] = useState<SFLConfig>(DEFAULT_SFL_CONFIG);
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null);
  const [savedDiagrams, setSavedDiagrams] = useState<SavedDiagram[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>('home');
  const [checkpoints, setCheckpoints] = useState<Record<string, Message[]>>({ 'home': [] });
  const [viewingDiagram, setViewingDiagram] = useState<SavedDiagram | null>(null);
  const [initialContextFiles, setInitialContextFiles] = useState<FileAttachment[]>([]);
  
  // Research Panel State
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  // Shared State
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([]);

  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' });
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
    let basePrompt = `You are ARIA, the Adaptive Research & Information Assistant. Your responses must be grounded using Google Search to provide accurate, up-to-date information.
Your primary directive is to provide concise, focused answers. Your responses should be limited to a maximum of two paragraphs, with each paragraph containing 3-4 sentences.
After providing your initial response, ALWAYS CONCLUDE with a clear, specific, and relevant question to encourage the user to continue the conversation or delve deeper. For example, instead of a generic "What's next?", ask "Would you like me to explain the role of chlorophyll in this process?". Do not add a "Continue" button or any similar UI elements in your text.`;

    if (initialContextFiles.length > 0) {
        const fileContext = initialContextFiles.map(file =>
            `--- START OF SOURCE FILE: ${file.name} ---\n${file.content}\n--- END OF SOURCE FILE: ${file.name} ---`
        ).join('\n\n');
        basePrompt += `\n\nThe user has provided the following source documents. Base your curriculum and all responses on this content:\n${fileContext}`;
    }

    basePrompt += "\n\nFor individual messages, the user may attach additional files. Their content will be provided below the user's prompt, marked by '--- START OF FILE: [filename] ---' and '--- END OF FILE: [filename] ---'. Analyze these files and incorporate them into your response for that specific message.";

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
  }, [sflConfig, currentSessionId, curriculum, initialContextFiles]);

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

  const handleSFLWizardFinish = async (finalConfig: SFLConfig, topic: string, files: FileAttachment[]) => {
    setSflConfig(finalConfig);
    setInitialContextFiles(files);
    setIsLoading(true);
    setPage('main');
    try {
      setLoadingMessage('Generating your personalized curriculum...');
      const sections = await generateCurriculum(topic, files, settings);
      setLoadingMessage('Discovering related topics for deeper learning...');
      const relatedTopics = await generateRelatedTopics(topic, files, settings);
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
    if (!finalPrompt.trim() && attachedFiles.length === 0) return;
    
    setError(null);
    setIsLoading(true);
    stopTTS(ttsPlayback);
    setTtsPlayback({ isPlaying: false, isLoading: false, messageId: null, audio: null });
    
    const userMessage: Message = { id: Date.now().toString(), role: Role.USER, content: finalPrompt, files: attachedFiles };
    const currentMessages = isRetry ? messages.slice(0, -1) : [...messages, userMessage];
    setMessages(currentMessages);
    
    let currentMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = { id: currentMessageId, role: Role.ASSISTANT, content: '' };
    setMessages(prev => [...prev, assistantMessage]);
    setAttachedFiles([]);

    try {
        const result = await streamText(settings, systemPrompt, currentMessages);
        let fullResponseText = '';

        for await (const delta of result.textStream) {
            fullResponseText += delta;
        }

        setMessages(prev => prev.map(msg =>
            msg.id === currentMessageId
                ? { ...msg, content: fullResponseText.trim() }
                : msg
        ));
        
        const finalResponse = result.getFinalResponse();
        const groundingMetadata = finalResponse?.candidates?.[0]?.groundingMetadata;

        if (groundingMetadata && groundingMetadata.groundingChunks && groundingMetadata.groundingChunks.length > 0) {
            setMessages(prev => {
                return prev.map(msg => {
                    if (msg.id === currentMessageId) {
                        return {
                            ...msg,
                            groundingMetadata: groundingMetadata.groundingChunks as any[],
                        };
                    }
                    return msg;
                });
            });
        }
    } catch (e: any) {
        console.error(e);
        const errorMessage = e.message || 'An unknown error occurred.';
        setError(`API Error: ${errorMessage}`);
        setMessages(prev => prev.filter(msg => msg.id !== currentMessageId));
    } finally {
        setIsLoading(false);
    }
  }, [messages, settings, systemPrompt, ttsPlayback, attachedFiles, setMessages, initialContextFiles]);

  const handleContinue = useCallback(() => {
    handleSendMessage('Continue');
  }, [handleSendMessage]);

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
    if (!settings.ttsEnabled || !settings.elevenLabsApiKey) return;
    
    const contentToPlay = message.content;
    if (!contentToPlay) return;

    if (ttsPlayback.isPlaying && ttsPlayback.messageId === message.id) {
        stopTTS(ttsPlayback);
        setTtsPlayback({ isPlaying: false, isLoading: false, messageId: null, audio: null });
        return;
    }
    
    // UI should prevent this, but as a safeguard.
    if (ttsPlayback.isLoading) return;

    stopTTS(ttsPlayback);
    setTtsPlayback({ isPlaying: false, isLoading: true, messageId: message.id, audio: null });
    
    try {
        setError(null);
        const audio = await playTTS(contentToPlay, settings.elevenLabsVoiceId, settings.elevenLabsApiKey);
        audio.onended = () => setTtsPlayback(current => {
            if (current.audio === audio) {
                return { isPlaying: false, isLoading: false, messageId: null, audio: null };
            }
            return current;
        });
        setTtsPlayback(current => {
            if (current.isLoading && current.messageId === message.id) {
                return { isPlaying: true, isLoading: false, messageId: message.id, audio };
            }
            // another request was initiated. this result is stale.
            stopTTS({ ...current, audio });
            return current;
        });
    } catch(e: any) {
        setError(`TTS Error: ${e.message}`);
        setTtsPlayback(current => {
            if(current.isLoading && current.messageId === message.id) {
               return { isPlaying: false, isLoading: false, messageId: null, audio: null };
            }
            return current;
        });
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
        const { introduction, subtopics, closing_question } = await generateLessonIntro(sectionTitle, settings);
        const content = `${introduction}\n\n> ${closing_question}`;

        const introMessage: Message = {
            id: Date.now().toString(),
            role: Role.ASSISTANT,
            content: content,
            subtopics: subtopics.map(st => ({ text: st, completed: false })),
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

  const handleSubtopicClick = useCallback((subtopic: string) => {
    if (!currentSessionId) return;

    // Mark subtopic as completed
    setMessages(prevMessages => {
        return prevMessages.map(msg => {
            if (msg.subtopics) {
                return {
                    ...msg,
                    subtopics: msg.subtopics.map(st => 
                        st.text === subtopic ? { ...st, completed: true } : st
                    )
                };
            }
            return msg;
        });
    });

    // Send message to AI
    handleSendMessage(`Please teach me about: "${subtopic}"`);
  }, [currentSessionId, setMessages, handleSendMessage]);
  
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
                dynamicModels={dynamicModels}
                setDynamicModels={setDynamicModels}
               />;
      case 'setupSFL':
        return <SFLWizardPage 
                    onFinish={handleSFLWizardFinish}
                    settings={settings}
                    onBack={() => setPage('setupProvider')}
                />;
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
              dynamicModels={dynamicModels}
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
              onSubtopicClick={handleSubtopicClick}
              onContinue={handleContinue}
              attachedFiles={attachedFiles}
              setAttachedFiles={setAttachedFiles}
              ttsSettings={{
                  enabled: settings.ttsEnabled,
                  onToggleTTS: handleTTS,
                  currentPlayingId: ttsPlayback.isPlaying ? ttsPlayback.messageId : null,
                  currentLoadingId: ttsPlayback.isLoading ? ttsPlayback.messageId : null,
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
