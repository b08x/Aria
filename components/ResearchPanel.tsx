import React from 'react';
import { SearchResults } from '../types';
import { MagnifyingGlassIcon } from './icons/MagnifyingGlassIcon';

interface ResearchPanelProps {
    results: SearchResults | null;
    isLoading: boolean;
    error: string | null;
    currentSessionId: string | null;
    lessonTitle: string | null;
}

const ResearchPanel: React.FC<ResearchPanelProps> = ({ results, isLoading, error, currentSessionId, lessonTitle }) => {

    const renderContent = () => {
        if (currentSessionId === 'home' || !currentSessionId) {
            return (
                <div className="text-center p-8 flex flex-col justify-center items-center h-full">
                    <MagnifyingGlassIcon className="w-16 h-16 mx-auto text-secondary/50 mb-4" />
                    <h3 className="text-lg font-semibold text-primary">Research Assistant</h3>
                    <p className="text-sm text-secondary">Select a lesson from the sidebar to automatically search for related web resources.</p>
                </div>
            );
        }
        
        if (isLoading) {
            return (
                <div className="p-4 space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="bg-background/50 p-3 rounded-lg animate-pulse">
                            <div className="h-4 bg-secondary/50 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-secondary/30 rounded w-full mb-3"></div>
                            <div className="h-3 bg-secondary/30 rounded w-5/6"></div>
                        </div>
                    ))}
                </div>
            );
        }
        
        if (error) {
            return (
                <div className="p-4 m-4 text-sm text-red-300 bg-red-900/50 rounded-md">
                    <p className="font-bold">Search Failed</p>
                    <p>{error}</p>
                </div>
            );
        }
        
        if (!results || !results.items || results.items.length === 0) {
            return <p className="text-center text-secondary p-4 mt-4">No web results found for this topic.</p>;
        }

        return (
            <div className="p-2 space-y-3">
                {results.items.map((item, index) => (
                    <a
                        key={index}
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block bg-surface/50 p-4 rounded-lg border border-transparent hover:border-accent/50 hover:bg-background/30 transition-all duration-200 group"
                    >
                        <h4 className="text-md font-semibold text-accent group-hover:underline truncate">{item.title}</h4>
                        <p className="text-xs text-secondary truncate mb-2">{item.link}</p>
                        <p className="text-sm text-primary/80 line-clamp-2">{item.snippet}</p>
                    </a>
                ))}
            </div>
        );
    };

    return (
        <aside className="w-96 h-screen bg-surface flex flex-col border-l border-secondary/50 flex-shrink-0">
            <header className="p-4 border-b border-secondary/50 flex items-center gap-3 flex-shrink-0">
                <MagnifyingGlassIcon className="w-6 h-6 text-accent" />
                <div className="flex-1 min-w-0">
                   <h2 className="text-lg font-bold text-primary truncate">
                       {lessonTitle ? `Resources for: ${lessonTitle}` : 'Research'}
                   </h2>
                </div>
            </header>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {renderContent()}
            </div>
        </aside>
    );
};

export default ResearchPanel;
