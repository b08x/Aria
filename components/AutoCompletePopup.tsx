import React from 'react';
import { Command } from '../commands';

interface AutoCompletePopupProps {
  commands: Command[];
  onSelect: (command: Command) => void;
  selectedIndex: number;
}

const AutoCompletePopup: React.FC<AutoCompletePopupProps> = ({ commands, onSelect, selectedIndex }) => {
  return (
    <div className="absolute bottom-full mb-2 w-full bg-surface border border-muted rounded-lg shadow-2xl z-10">
      <div className="p-2 text-xs text-secondary font-semibold">COMMANDS</div>
      <ul className="max-h-60 overflow-y-auto custom-scrollbar">
        {commands.map((cmd, index) => (
          <li
            key={cmd.name}
            className={`px-3 py-2 cursor-pointer flex items-center gap-3 ${index === selectedIndex ? 'bg-accent/20' : 'hover:bg-muted/20'}`}
            onClick={() => onSelect(cmd)}
            onMouseDown={(e) => e.preventDefault()} // Prevent textarea from losing focus
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-md bg-background flex items-center justify-center">
              <span className="font-mono text-accent">/</span>
            </div>
            <div>
                <p className={`font-bold ${index === selectedIndex ? 'text-accent' : 'text-primary'}`}>{cmd.name}</p>
                <p className={`text-sm ${index === selectedIndex ? 'text-primary' : 'text-secondary'}`}>{cmd.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AutoCompletePopup;