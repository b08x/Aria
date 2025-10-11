import React, { useState, useMemo } from 'react';
import { Curriculum, SavedDiagram, Settings, ApiKeyStatus, Task, Section } from '../types';
import { PROVIDERS } from '../constants';
import { AcademicCapIcon } from './icons/AcademicCapIcon';
import { BeakerIcon } from './icons/BeakerIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { QuestionMarkCircleIcon } from './icons/QuestionMarkCircleIcon';
import { ChartPieIcon } from './icons/ChartPieIcon';
import { ClipboardDocumentListIcon } from './icons/ClipboardDocumentListIcon';
import { Cog6ToothIcon } from './icons/Cog6ToothIcon';
import TaskPanel from './TaskPanel';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ArrowRightCircleIcon } from './icons/ArrowRightCircleIcon';

interface SidebarProps {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  apiKeyStatus: Record<string, ApiKeyStatus>;
  curriculum: Curriculum | null;
  currentSessionId: string | null;
  onSectionClick: (sectionId: string, sectionTitle: string) => void;
  savedDiagrams: SavedDiagram[];
  onViewDiagram: (diagram: SavedDiagram) => void;
  onDeleteDiagram: (diagramId: string) => void;
  onTakeQuiz: (moduleId: string) => void;
  dynamicModels: Record<string, string[]>;
  onShowTutorial: () => void;
  tasks: Task[];
  onAddTask: (text: string) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onEditTask: (id: string, newText: string) => void;
  sessionNotes: Record<string, string>;
  setSessionNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  completedLessons: Set<string>;
  onToggleLessonComplete: (lessonId: string) => void;
}

type ActiveView = 'learn' | 'diagrams' | 'tasks' | 'settings';

// --- Reusable Navigation Button Component ---
interface NavButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
  badgeCount?: number;
}

const NavButton: React.FC<NavButtonProps> = ({ label, isActive, onClick, children, badgeCount }) => (
    <div className="relative group">
        <button
            onClick={onClick}
            className={`w-12 h-12 flex items-center justify-center rounded-lg transition-colors relative ${
                isActive ? 'bg-accent/20 text-accent' : 'text-secondary hover:bg-muted hover:text-primary'
            }`}
            aria-label={label}
        >
            {children}
            {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-accent rounded-r-full"></div>}
            {badgeCount !== undefined && badgeCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent-dark text-xs font-bold text-background border-2 border-background/50">
                    {badgeCount}
                </span>
            )}
        </button>
        <div className="absolute left-full ml-3 px-2 py-1 bg-background text-primary text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
            {label}
        </div>
    </div>
);

const Sidebar: React.FC<SidebarProps> = ({
  settings,
  setSettings,
  apiKeyStatus,
  curriculum,
  currentSessionId,
  onSectionClick,
  savedDiagrams,
  onViewDiagram,
  onDeleteDiagram,
  onTakeQuiz,
  dynamicModels,
  onShowTutorial,
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onEditTask,
  sessionNotes,
  setSessionNotes,
  completedLessons,
  onToggleLessonComplete,
}) => {
  const [activeView, setActiveView] = useState<ActiveView>('learn');
  const incompleteTasksCount = useMemo(() => tasks.filter(t => !t.completed).length, [tasks]);
  
  const handleSettingsChange = (field: keyof Settings, value: any) => {
    setSettings(prev => {
      const newState = { ...prev, [field]: value };
      if (field === 'provider') {
        const newProviderKey = value;
        const availableModels = dynamicModels[newProviderKey] || PROVIDERS[newProviderKey].models;
        newState.model = availableModels[0];
      }
      return newState;
    });
  };

  const getStatusIndicator = (status: ApiKeyStatus | undefined) => {
    switch(status) {
        case 'valid': return <span className="text-xs text-green-400">Verified</span>;
        case 'invalid': return <span className="text-xs text-red-300">Invalid Key</span>;
        case 'ratelimited': return <span className="text-xs text-orange-400">Unavailable</span>;
        default: return <span className="text-xs text-secondary">Unverified</span>;
    }
  };

  const renderSettingsPanel = () => {
    const commonInputClasses = "w-full px-3 py-2 bg-surface border border-muted text-primary rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-accent transition-colors placeholder-secondary";
    const modelList = dynamicModels[settings.provider] || PROVIDERS[settings.provider].models;
    
    return (
        <>
            <header className="p-4 border-b border-muted flex-shrink-0">
                <h2 className="text-xl font-semibold text-primary flex items-center gap-2">
                    <Cog6ToothIcon className="w-6 h-6 text-secondary"/>
                    Settings
                </h2>
            </header>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
                <fieldset className="space-y-4">
                    <legend className="text-lg font-semibold text-accent mb-2">⚙️ AI Provider</legend>
                    {/* ... (rest of the settings form) ... */}
                    <div>
                        <label htmlFor="provider-select" className="block text-sm font-medium text-primary/80 mb-1">Provider</label>
                        <select id="provider-select" value={settings.provider} onChange={e => handleSettingsChange('provider', e.target.value)} className={commonInputClasses}>
                            {Object.entries(PROVIDERS).map(([key, {name}]) => (
                                <option key={key} value={key}>{name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="block text-sm font-medium text-primary/80">API Key</label>
                            {getStatusIndicator(apiKeyStatus[settings.provider])}
                        </div>
                        <input type="password" value={settings.apiKey} onChange={e => handleSettingsChange('apiKey', e.target.value)} placeholder="Enter your API key" className={commonInputClasses} />
                    </div>
                    <div>
                        <label htmlFor="model-select" className="block text-sm font-medium text-primary/80 mb-1">Model</label>
                        <select id="model-select" value={settings.model} onChange={e => handleSettingsChange('model', e.target.value)} className={commonInputClasses}>
                            {modelList.map(model => (
                                <option key={model} value={model}>{model}</option>
                            ))}
                        </select>
                    </div>
                </fieldset>
                
                <fieldset className="space-y-4">
                    <legend className="text-lg font-semibold text-accent mb-2">🔬 Research Tools</legend>
                    <div className="text-xs text-secondary bg-background p-2 rounded-md">
                        Enable ARIA to fetch external web pages by providing a Google Custom Search API key and a Programmable Search Engine ID.
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-primary/80 mb-1">Google Custom Search API Key</label>
                        <input type="password" value={settings.googleCseApiKey} onChange={e => handleSettingsChange('googleCseApiKey', e.target.value)} placeholder="Enter Google CSE key" className={commonInputClasses} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-primary/80 mb-1">Search Engine ID</label>
                        <input type="text" value={settings.googleCseId} onChange={e => handleSettingsChange('googleCseId', e.target.value)} placeholder="Enter your Search Engine ID" className={commonInputClasses} />
                    </div>
                </fieldset>

                <fieldset className="space-y-4">
                    <legend className="text-lg font-semibold text-accent mb-2">🔊 Text-to-Speech</legend>
                    <div className="flex items-center justify-between bg-background p-2 rounded-md">
                        <label htmlFor="tts-toggle" className="text-sm font-medium text-primary/80">Enable TTS Output</label>
                        <button
                            id="tts-toggle"
                            role="switch"
                            aria-checked={settings.ttsEnabled}
                            onClick={() => handleSettingsChange('ttsEnabled', !settings.ttsEnabled)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.ttsEnabled ? 'bg-accent' : 'bg-muted'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-primary transition-transform ${settings.ttsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                </fieldset>
            </div>
        </>
    );
  };

  const renderLearnPanel = () => {
    const structuredCurriculum = useMemo(() => {
        if (!curriculum) return [];
        const modules: Array<{ module: Section; lessons: Section[] }> = [];
    
        curriculum.sections.forEach((section) => {
            if (section.level === 2) {
                modules.push({ module: section, lessons: [] });
            } else if (section.level > 2 && modules.length > 0) {
                modules[modules.length - 1].lessons.push(section);
            }
        });
        return modules;
    }, [curriculum]);

    return (
        <>
            <header className="p-4 border-b border-muted flex-shrink-0">
                 <h2 className="text-xl font-semibold text-primary flex items-center gap-2">
                    <BookOpenIcon className="w-6 h-6 text-secondary"/>
                    Learn
                </h2>
            </header>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-4">
                <button
                    onClick={() => onSectionClick('home', 'Home / Scratchpad')}
                    className={`w-full text-left p-3 text-sm rounded-lg flex items-center gap-3 transition-colors ${currentSessionId === 'home' ? 'bg-accent/20 text-accent font-semibold' : 'hover:bg-muted/20'}`}
                >
                    <BeakerIcon className="w-5 h-5 flex-shrink-0" />
                    Home / Scratchpad
                </button>

                {curriculum ? (
                    <>
                    <div className="space-y-6">
                        {structuredCurriculum.map(({ module, lessons }) => (
                            <div key={module.id}>
                                <div className="flex items-center justify-between px-2 mb-2">
                                     <h3 className="text-sm font-bold text-accent uppercase tracking-wider">{module.title}</h3>
                                     {module.hasContent && (
                                         <button
                                            onClick={() => onTakeQuiz(module.id)}
                                            className="text-xs text-accent hover:underline font-semibold"
                                            title={`Take a quiz on ${module.title}`}
                                          >
                                            Test
                                          </button>
                                    )}
                                </div>
                                <ul className="relative">
                                    {lessons.map((lesson, index) => {
                                        const isCompleted = completedLessons.has(lesson.id);
                                        const isActive = lesson.id === currentSessionId;
                                        
                                        const StatusIcon = () => {
                                            if (isCompleted) return <CheckCircleIcon className="w-6 h-6 text-green-400" />;
                                            if (isActive) return <ArrowRightCircleIcon className="w-6 h-6 text-accent animate-pulse-sm" />;
                                            return <div className="w-6 h-6 flex items-center justify-center"><div className="w-3 h-3 bg-transparent border-2 border-muted rounded-full"></div></div>;
                                        };

                                        return (
                                            <li key={lesson.id} className="relative flex items-start pb-4">
                                                {index < lessons.length && (
                                                     <div className={`absolute left-3 top-5 h-full border-l-2 ${isCompleted ? 'border-green-400' : 'border-dashed border-muted'}`}></div>
                                                )}
                                                <div className="relative z-10 flex-shrink-0 mt-0.5">
                                                    <StatusIcon />
                                                </div>
                                                <div className="ml-4 flex-grow min-w-0">
                                                    <button
                                                        onClick={() => onSectionClick(lesson.id, lesson.title)}
                                                        className={`w-full text-left text-sm transition-colors ${isActive ? 'text-accent font-semibold' : ''} ${isCompleted ? 'text-secondary line-through' : 'text-primary hover:text-accent'}`}
                                                    >
                                                        {lesson.title}
                                                    </button>
                                                </div>
                                                <div className="ml-2 flex-shrink-0">
                                                    <input
                                                        type="checkbox"
                                                        checked={isCompleted}
                                                        onChange={() => onToggleLessonComplete(lesson.id)}
                                                        className="w-4 h-4 bg-surface border-muted text-green-500 rounded focus:ring-green-400 cursor-pointer"
                                                        aria-label={`Mark "${lesson.title}" as ${isCompleted ? 'incomplete' : 'complete'}`}
                                                    />
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        ))}
                    </div>
                    {currentSessionId && currentSessionId !== 'home' && (
                      <div>
                        <h3 className="px-2 text-sm font-semibold text-secondary uppercase tracking-wider mb-2 mt-4">
                          📝 Session Notes
                        </h3>
                        <div className="p-2">
                          <textarea
                            value={sessionNotes[currentSessionId] || ''}
                            onChange={(e) => {
                                const newNotes = e.target.value;
                                setSessionNotes(prev => ({
                                    ...prev,
                                    [currentSessionId!]: newNotes,
                                }));
                            }}
                            placeholder="Jot down notes for this lesson. They'll be included as context for ARIA."
                            className="w-full h-32 p-2 bg-background border border-muted rounded-md text-sm text-primary custom-scrollbar resize-y focus:outline-none focus:ring-2 focus:ring-accent"
                            aria-label="Session Notes"
                          />
                        </div>
                      </div>
                    )}
                    </>
                ) : (
                    <div className="p-4 text-center text-sm text-secondary">
                        <p>Your lesson plan will appear here after the initial setup.</p>
                    </div>
                )}
            </div>
        </>
    );
  };
  
  const renderDiagramsPanel = () => (
      <>
        <header className="p-4 border-b border-muted flex-shrink-0">
             <h2 className="text-xl font-semibold text-primary flex items-center gap-2">
                <ChartPieIcon className="w-6 h-6 text-secondary"/>
                Diagrams
            </h2>
        </header>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
          {savedDiagrams.length > 0 ? (
            <ul>
              {savedDiagrams.map(diagram => (
                <li key={diagram.id} className="group flex items-center justify-between p-2 rounded-md hover:bg-muted/20">
                  <button onClick={() => onViewDiagram(diagram)} className="flex items-center gap-3 flex-grow text-left min-w-0">
                    <img src={diagram.pngDataUrl} alt={diagram.title} className="w-10 h-10 object-contain bg-white p-1 rounded-md flex-shrink-0" />
                    <span className="text-sm text-primary truncate flex-grow">{diagram.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-8 text-center text-sm text-secondary flex flex-col items-center justify-center h-full">
              <ChartPieIcon className="w-12 h-12 text-muted mb-4"/>
              <p className="font-semibold text-primary">No Diagrams Saved</p>
              <p>Generate diagrams from paragraphs in the chat and they will be saved here.</p>
            </div>
          )}
        </div>
      </>
  );

  return (
    <aside className="w-96 h-screen bg-surface flex border-r border-muted flex-shrink-0">
        <nav className="w-20 flex flex-col items-center py-4 bg-background/50 border-r border-muted space-y-2">
            <div className="flex items-center justify-center h-12 mb-4" title="ARIA">
                <AcademicCapIcon className="w-8 h-8 text-accent"/>
            </div>

            <NavButton label="Learn" isActive={activeView === 'learn'} onClick={() => setActiveView('learn')}>
                <BookOpenIcon className="w-6 h-6"/>
            </NavButton>
            <NavButton label="Diagrams" isActive={activeView === 'diagrams'} onClick={() => setActiveView('diagrams')} badgeCount={savedDiagrams.length}>
                <ChartPieIcon className="w-6 h-6"/>
            </NavButton>
            <NavButton label="Tasks" isActive={activeView === 'tasks'} onClick={() => setActiveView('tasks')} badgeCount={incompleteTasksCount}>
                <ClipboardDocumentListIcon className="w-6 h-6"/>
            </NavButton>
            
            <div className="flex-grow" />

            <NavButton label="Settings" isActive={activeView === 'settings'} onClick={() => setActiveView('settings')}>
                <Cog6ToothIcon className="w-6 h-6"/>
            </NavButton>
            <button
                onClick={onShowTutorial}
                className="group relative w-12 h-12 flex items-center justify-center rounded-lg text-secondary hover:bg-muted hover:text-primary transition-colors"
                aria-label="Show Tutorial"
            >
                <QuestionMarkCircleIcon className="w-6 h-6" />
                <div className="absolute left-full ml-3 px-2 py-1 bg-background text-primary text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    Help & Tutorial
                </div>
            </button>
        </nav>

        <div className="flex-1 flex flex-col min-w-0">
            {activeView === 'learn' && renderLearnPanel()}
            {activeView === 'diagrams' && renderDiagramsPanel()}
            {activeView === 'tasks' && (
                <>
                    <header className="p-4 border-b border-muted flex-shrink-0">
                        <h2 className="text-xl font-semibold text-primary flex items-center gap-2">
                           <ClipboardDocumentListIcon className="w-6 h-6 text-secondary"/>
                           Tasks
                        </h2>
                    </header>
                    <TaskPanel
                      tasks={tasks}
                      onAddTask={onAddTask}
                      onToggleTask={onToggleTask}
                      onDeleteTask={onDeleteTask}
                      onEditTask={onEditTask}
                    />
                </>
            )}
            {activeView === 'settings' && renderSettingsPanel()}
        </div>
    </aside>
  );
};

export default Sidebar;