


import React, { useState, useRef, useEffect } from 'react';
import { EllipsisVerticalIcon } from './icons/EllipsisVerticalIcon';

interface ParagraphMenuProps {
  paragraphText: string;
  onElaborate: (text: string) => void;
  onGenerateDiagram: (text: string) => void;
  onGenerateImage: (text: string) => void;
}

const ParagraphMenu: React.FC<ParagraphMenuProps> = ({ paragraphText, onElaborate, onGenerateDiagram, onGenerateImage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copyText, setCopyText] = useState('Copy as Markdown');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  useEffect(() => {
    // Reset copy text if menu is closed without copying
    if (!isOpen) {
      setTimeout(() => setCopyText('Copy as Markdown'), 200);
    }
  }, [isOpen]);

  const handleCopy = () => {
    navigator.clipboard.writeText(paragraphText).then(() => {
      setCopyText('Copied!');
      setTimeout(() => {
        setIsOpen(false);
      }, 1000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      setCopyText('Failed to copy');
       setTimeout(() => {
        setIsOpen(false);
      }, 1000);
    });
  };
  
  const createMenuAction = (label: string, action: () => void) => (
    <button
      onClick={action}
      className="block w-full text-left px-4 py-2 text-sm text-primary hover:bg-muted/50"
    >
      {label}
    </button>
  );

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 rounded-full bg-surface/80 hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-accent"
        aria-label="Paragraph actions"
      >
        <EllipsisVerticalIcon className="w-5 h-5 text-primary/80" />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-surface border border-muted rounded-md shadow-2xl z-20 py-1">
          {createMenuAction('Elaborate', () => { onElaborate(paragraphText); setIsOpen(false); })}
          {createMenuAction('Generate Diagram', () => { onGenerateDiagram(paragraphText); setIsOpen(false); })}
          {createMenuAction('Generate Image', () => { onGenerateImage(paragraphText); setIsOpen(false); })}
          <div className="my-1 border-t border-muted"></div>
          {createMenuAction(copyText, handleCopy)}
        </div>
      )}
    </div>
  );
};

export default ParagraphMenu;