import React, { useState, useMemo } from 'react';
import { Curriculum, SavedDiagram, Settings, Provider, ApiKeyStatus, Task } from '../types';
import { TrashIcon } from './icons/TrashIcon';
import { PROVIDERS } from '../constants';
import { AcademicCapIcon } from './icons/AcademicCapIcon';
import { BeakerIcon } from './icons/BeakerIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { QuestionMarkCircleIcon } from './icons/QuestionMarkCircleIcon';
import TaskPanel from './TaskPanel';

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
}

type ActiveTab = 'lessons' | 'diagrams' | 'tasks' | 'settings';

type TabButtonProps = {
  tab: ActiveTab;
  label: string;
  activeTab: ActiveTab;
  onClick: (tab: ActiveTab) => void;
};

const TabButton: React.FC<TabButtonProps> = ({ tab, label, activeTab, onClick }) => (
    <button
      onClick={() => onClick(tab)}
      className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
        activeTab === tab
          ? 'text-accent border-accent'
          : 'text-secondary border-transparent hover:text-primary hover:border-muted'
      }`}
    >
      {label}
    </button>
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
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('lessons');
  const incompleteTasksCount = useMemo(() => tasks.filter(t => !t.completed).length, [tasks]);
  
  const handleSettingsChange = (field: keyof Settings, value: any) => {
    setSettings(prev => {
      const newState = { ...prev, [field]: value };
      if (field === 'provider') {
        const newProviderKey = value as Provider;
        const availableModels = dynamicModels[newProviderKey] || PROVIDERS[newProviderKey].models;
        newState.model = availableModels[0];
      }
      return newState;
    });
  };

  const getPadding = (level: number) => {
    switch (level) {
      case 2: return 'pl-4';
      case 3: return 'pl-8';
      case 4: return 'pl-12';
      default: return 'pl-4';
    }
  };
  
  const getStatusIndicator = (status: ApiKeyStatus | undefined) => {
    switch(status) {
        case 'valid': return <span className="text-xs text-green-400">Verified</span>;
        case 'invalid': return <span className="text-xs text-red-300">Invalid Key</span>;
        case 'ratelimited': return <span className="text-xs text-orange-400">Unavailable</span>;
        default: return <span className="text-xs text-secondary">Unverified</span>;
    }
  };

  const commonInputClasses = "w-full px-3 py-2 bg-surface border border-muted text-primary rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-accent transition-colors placeholder-secondary";
  const modelList = dynamicModels[settings.provider] || PROVIDERS[settings.provider].models;

  const renderSettings = () => (
    <div className="p-4 space-y-6">
        <fieldset className="space-y-4">
            <legend className="text-lg font-semibold text-accent mb-2">AI Provider</legend>
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
            <legend className="text-lg font-semibold text-accent mb-2">Research Tools</legend>
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
            <legend className="text-lg font-semibold text-accent mb-2">Text-to-Speech</legend>
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
  );

  const renderLessons = () => (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-4">
      <button
            onClick={() => onSectionClick('home', 'Home / Scratchpad')}
            className={`w-full text-left p-2 text-sm rounded-md mb-2 flex items-center gap-3 ${currentSessionId === 'home' ? 'bg-accent/20 text-accent font-semibold' : 'hover:bg-muted/20'}`}
        >
            <BeakerIcon className="w-5 h-5 flex-shrink-0" />
            Home / Scratchpad
      </button>

      {curriculum ? (
        <>
        {/* Lesson Plan */}
        <div>
            <h2 className="px-2 text-xs font-semibold text-secondary uppercase tracking-wider mb-1">Lesson Plan</h2>
            <nav>
                <ul>
                {curriculum.sections.map((section) => {
                    const isActive = section.id === currentSessionId;
                    return (
                    <li key={section.id} className={`flex flex-col rounded-md group ${isActive ? 'bg-accent/20' : ''}`}>
                        <button
                          onClick={() => onSectionClick(section.id, section.title)}
                          className={`flex-grow w-full text-left p-2 text-sm transition-colors ${getPadding(section.level)} ${isActive ? 'text-accent font-semibold' : 'hover:text-accent hover:bg-muted/20 rounded-md'}`}
                        >
                        {section.title}
                        </button>
                        {section.level === 2 && section.hasContent && (
                             <button
                                onClick={() => onTakeQuiz(section.id)}
                                className="text-xs text-accent hover:text-accent font-semibold self-start ml-auto mr-2 mb-2 px-2 py-1 rounded bg-accent/10 hover:bg-accent/20"
                              >
                                Take Quiz
                              </button>
                        )}
                    </li>
                    )
                })}
                </ul>
            </nav>
        </div>
        {/* Session Notes */}
        {currentSessionId && currentSessionId !== 'home' && (
          <div>
            <h2 className="px-2 text-xs font-semibold text-secondary uppercase tracking-wider mb-1 mt-4">
              Session Notes
            </h2>
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
  );

  const renderDiagrams = () => (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
      {savedDiagrams.length > 0 ? (
        <ul>
          {savedDiagrams.map(diagram => (
            <li key={diagram.id} className="group flex items-center justify-between p-2 rounded-md hover:bg-muted/20">
              <button onClick={() => onViewDiagram(diagram)} className="flex items-center gap-3 flex-grow text-left min-w-0">
                <img src={diagram.pngDataUrl} alt={diagram.title} className="w-10 h-10 object-contain bg-background rounded-md flex-shrink-0" />
                <span className="text-sm text-primary truncate flex-grow">{diagram.title}</span>
              </button>
              <button
                onClick={() => onDeleteDiagram(diagram.id)}
                className="p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600/20 text-red-300 flex-shrink-0"
                aria-label={`Delete ${diagram.title}`}
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="p-4 text-center text-sm text-secondary">
          <p>Generate diagrams from paragraphs in the chat and they will be saved here.</p>
        </div>
      )}
    </div>
  );

  return (
    <aside className="w-96 h-screen bg-surface flex flex-col border-r border-muted flex-shrink-0">
      <header className="p-4 border-b border-muted flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
            <AcademicCapIcon className="w-8 h-8 text-accent"/>
            <h1 className="text-xl font-bold text-primary">ARIA</h1>
        </div>
        <button
            onClick={onShowTutorial}
            className="p-2 rounded-full text-secondary hover:text-primary hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-accent"
            aria-label="Show tutorial"
        >
            <QuestionMarkCircleIcon className="w-6 h-6" />
        </button>
      </header>
      <div className="border-b border-muted flex-shrink-0">
        <nav className="flex justify-around">
          <TabButton tab="lessons" label="Learn" activeTab={activeTab} onClick={setActiveTab} />
          <TabButton tab="diagrams" label={`Diagrams (${savedDiagrams.length})`} activeTab={activeTab} onClick={setActiveTab} />
          <TabButton tab="tasks" label={`Tasks (${incompleteTasksCount})`} activeTab={activeTab} onClick={setActiveTab} />
          <TabButton tab="settings" label="Settings" activeTab={activeTab} onClick={setActiveTab} />
        </nav>
      </div>

      {activeTab === 'lessons' && renderLessons()}
      {activeTab === 'diagrams' && renderDiagrams()}
      {activeTab === 'tasks' && (
        <TaskPanel
          tasks={tasks}
          onAddTask={onAddTask}
          onToggleTask={onToggleTask}
          onDeleteTask={onDeleteTask}
          onEditTask={onEditTask}
        />
      )}
      {activeTab === 'settings' && <div className="flex-1 overflow-y-auto custom-scrollbar">{renderSettings()}</div>}
    </aside>
  );
};

export default Sidebar;