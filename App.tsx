import React, { useState, useCallback, useMemo, useEffect } from 'react';
import mermaid from 'mermaid';
import { Settings, Message, TTSPlayback, Role, Curriculum, SFLConfig, SavedDiagram, FileAttachment, ApiKeyStatus, SearchResults, Provider, Task } from './types';
import { generateCurriculum, generateDiagramData, streamText, generateQuiz, generateLessonIntro, generateImage, fetchSearchResults } from './services/aiService';
import { playTTS, stopTTS } from './services/elevenLabsService';
import { INITIAL_SETTINGS, DEFAULT_SFL_CONFIG } from './constants';
import Sidebar from './components/Sidebar';
import ChatPanel from './components/ChatPanel';
import DiagramModal from './components/DiagramModal';
import LandingPage from './components/LandingPage';
import ProviderSetupPage from './components/ProviderSetupPage';
import SFLWizardPage from './components/SFLWizardPage';
import ResearchPanel from './components/ResearchPanel';
import Tutorial from './components/Tutorial';

type Page = 'landing' | 'setupProvider' | 'setupSFL' | 'main';

const App: React.FC = () => {
  const [page, setPage] = useState<Page>('landing');
  const [showTutorial, setShowTutorial] = useState(false);

  // Playground State
  const [settings, setSettings] = useState<Settings>(INITIAL_SETTINGS);
  const [apiKeyStatus, setApiKeyStatus] = useState<Record<string, ApiKeyStatus>>({});
  const [ttsPlayback, setTtsPlayback] = useState<TTSPlayback>({ isPlaying: false, isLoading: false, messageId: null });
  const [dynamicModels, setDynamicModels] = useState<Record<string, string[]>>({});

  // ARIA State
  const [sflConfig, setSflConfig] = useState<SFLConfig>(DEFAULT_SFL_CONFIG);
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null);
  const [savedDiagrams, setSavedDiagrams] = useState<SavedDiagram[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>('home');
  const [checkpoints, setCheckpoints] = useState<Record<string, Message[]>>({ 'home': [] });
  const [sessionNotes, setSessionNotes] = useState<Record<string, string>>({});
  const [viewingDiagram, setViewingDiagram] = useState<SavedDiagram | null>(null);
  const [initialContextFiles, setInitialContextFiles] = useState<FileAttachment[]>([]);
  
  // Task Management State
  const [tasks, setTasks] = useState<Task[]>([]);
  
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

  useEffect(() => {
    if (page === 'main') {
        const tutorialCompleted = localStorage.getItem('aria-tutorial-completed');
        if (!tutorialCompleted) {
            setShowTutorial(true);
        }
    }
  }, [page]);

  // Load tasks from localStorage on initial mount
  useEffect(() => {
    try {
      const savedTasks = localStorage.getItem('aria-tasks');
      if (savedTasks) {
        setTasks(JSON.parse(savedTasks));
      }
    } catch (error) {
      console.error('Failed to load tasks from localStorage', error);
    }
  }, []);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    try {
      if (tasks.length > 0) {
        localStorage.setItem('aria-tasks', JSON.stringify(tasks));
      } else {
        localStorage.removeItem('aria-tasks');
      }
    } catch (error) {
      console.error('Failed to save tasks to localStorage', error);
    }
  }, [tasks]);
  
  const handleCloseTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem('aria-tutorial-completed', 'true');
  };

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
        if (sflConfig.sflTenor.desiredTone) basePrompt += `\n- Adopt a tone that is: ${sflConfig.sflTenor.desiredTone}.`;
        if (sflConfig.sflTenor.interpersonalStance) basePrompt += `\n- Your stance towards the user should be that of a: ${sflConfig.sflTenor.interpersonalStance}.`;
        if (sflConfig.sflMode.outputFormat) basePrompt += `\n- Format your response as: ${sflConfig.sflMode.outputFormat}.`;
    }

    const activeSection = curriculum?.sections.find(s => s.id === currentSessionId);
    if (activeSection) {
        basePrompt += `\n\n# CURRENT LESSON\nFocus your response exclusively on teaching the following topic: "${activeSection.title}".`;
    }
    
    const currentNote = sessionNotes[currentSessionId || 'home'];
    if (currentNote && currentNote.trim()) {
        basePrompt += `\n\n# USER'S NOTES FOR THIS LESSON\nThe user has provided the following notes for context. Refer to these notes when formulating your response:\n${currentNote.trim()}`;
    }
    
    return basePrompt;
  }, [sflConfig, currentSessionId, curriculum, initialContextFiles, sessionNotes]);

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
      setCurriculum({ sections });
       const initialMessage: Message = { id: Date.now().toString(), role: Role.ASSISTANT, content: `I've generated your personalized curriculum for **${topic}**. You can see it in the sidebar. Click any lesson to begin!` };
       setMessages(prev => [...prev, initialMessage]);
    } catch(e: any) {
        setError(`Initialization failed: ${e.message}`);
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
    }
  }

  const handleSendMessage = useCallback(async (prompt: string, isRetry = false) => {
    let finalPrompt = prompt;
    // If files are attached and the user hasn't provided a prompt, default to summarization.
    if (attachedFiles.length > 0 && !finalPrompt.trim() && !isRetry) {
        const fileNames = attachedFiles.map(f => f.name).join(', ');
        finalPrompt = `Please provide a concise summary for the following file(s): ${fileNames}.`;
    }

    if (!finalPrompt.trim() && attachedFiles.length === 0 && !isRetry) return;
    
    setError(null);
    setIsLoading(true);
    stopTTS();
    setTtsPlayback({ isPlaying: false, isLoading: false, messageId: null });

    const messagesForApi = isRetry ? messages : [...messages, { 
        id: Date.now().toString(), 
        role: Role.USER, 
        content: finalPrompt, 
        files: attachedFiles 
    }];
    
    if (!isRetry) {
        setMessages(messagesForApi);
        setAttachedFiles([]);
    }
    
    const currentMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = { id: currentMessageId, role: Role.ASSISTANT, content: '' };
    setMessages(prev => [...prev, assistantMessage]);

    try {
        const result = await streamText(settings, systemPrompt, messagesForApi);

        for await (const delta of result.textStream) {
            if (delta) {
                setMessages(prev => prev.map(msg =>
                    msg.id === currentMessageId
                        ? { ...msg, content: msg.content + delta }
                        : msg
                ));
            }
        }
        
        const finalResponse = result.getFinalResponse();
        const groundingMetadata = finalResponse?.candidates?.[0]?.groundingMetadata;

        if (groundingMetadata && groundingMetadata.groundingChunks && groundingMetadata.groundingChunks.length > 0) {
            setMessages(prev => {
                return prev.map(msg => {
                    if (msg.id === currentMessageId) {
                        return {
                            ...msg,
                            content: msg.content.trim(),
                            groundingMetadata: groundingMetadata.groundingChunks as any[],
                        };
                    }
                    return msg;
                });
            });
        } else {
             setMessages(prev => prev.map(msg =>
                msg.id === currentMessageId
                    ? { ...msg, content: msg.content.trim() }
                    : msg
            ));
        }
    } catch (e: any) {
        console.error(e);
        const errorMessage = e.message || 'An unknown error occurred.';
        setError(`API Error: ${errorMessage}`);
        setMessages(prev => prev.filter(msg => msg.id !== currentMessageId));
    } finally {
        setIsLoading(false);
    }
  }, [messages, settings, systemPrompt, attachedFiles, setMessages]);

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


  const handleTTS = useCallback((message: Message) => {
    if (!settings.ttsEnabled) return;

    const contentToPlay = message.content;
    if (!contentToPlay) return;

    // If we click the button on the message that is currently playing, stop it.
    if (ttsPlayback.isPlaying && ttsPlayback.messageId === message.id) {
        stopTTS();
        setTtsPlayback({ isPlaying: false, isLoading: false, messageId: null });
        return;
    }
    
    // Stop any currently playing audio before starting a new one.
    stopTTS();

    // Set loading state for the new message
    setTtsPlayback({ isPlaying: false, isLoading: true, messageId: message.id });

    const onStart = () => {
        setTtsPlayback(current => {
            // Only switch to playing if we are still loading this specific message
            if (current.isLoading && current.messageId === message.id) {
                return { isPlaying: true, isLoading: false, messageId: message.id };
            }
            return current; // State changed for another reason, do nothing.
        });
    };

    const onEnd = () => {
        setTtsPlayback(current => {
            // Only reset state if the ended message is the one we think is playing
            if (current.messageId === message.id) {
                return { isPlaying: false, isLoading: false, messageId: null };
            }
            return current;
        });
    };

    const onError = (e: SpeechSynthesisErrorEvent) => {
        console.error("TTS Error:", e);
        setError(`TTS Error: ${e.error}`);
        // Reset state if this message caused the error
        setTtsPlayback(current => {
            if (current.messageId === message.id) {
                return { isPlaying: false, isLoading: false, messageId: null };
            }
            return current;
        });
    }

    playTTS(contentToPlay, onStart, onEnd, onError);
  }, [settings.ttsEnabled, ttsPlayback, setError]);

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

  const handleAddTask = (text: string) => {
    if (!text.trim()) return;
    const newTask: Task = { id: Date.now().toString(), text: text.trim(), completed: false };
    setTasks(prev => [...prev, newTask]);
  };

  const handleToggleTask = (id: string) => {
      setTasks(prev => prev.map(task => task.id === id ? { ...task, completed: !task.completed } : task));
  };

  const handleDeleteTask = (id: string) => {
      setTasks(prev => prev.filter(task => task.id !== id));
  };

  const handleEditTask = (id: string, newText: string) => {
      setTasks(prev => prev.map(task => task.id === id ? { ...task, text: newText.trim() } : task));
  };
  
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
        const lessonTitle = curriculum?.sections.find(s => s.id === currentSessionId)?.title || null;
        
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
              onShowTutorial={() => setShowTutorial(true)}
              tasks={tasks}
              onAddTask={handleAddTask}
              onToggleTask={handleToggleTask}
              onDeleteTask={handleDeleteTask}
              onEditTask={handleEditTask}
              sessionNotes={sessionNotes}
              setSessionNotes={setSessionNotes}
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
            {showTutorial && <Tutorial onClose={handleCloseTutorial} />}
          </div>
        );
    }
  };

  return <>{renderPage()}</>;
};

export default App;