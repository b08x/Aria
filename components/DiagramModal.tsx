

import React from 'react';
import ModalShell from './ModalShell';

interface DiagramModalProps {
  pngDataUrl: string;
  title: string;
  onClose: () => void;
}

const DiagramModal: React.FC<DiagramModalProps> = ({ pngDataUrl, title, onClose }) => {
  return (
    <ModalShell isOpen={true} onClose={onClose} title={title} size="3xl">
      <div 
        className="w-full h-full flex items-center justify-center p-4 bg-background rounded-lg overflow-auto custom-scrollbar"
        style={{ minHeight: '70vh' }}
      >
        <img src={pngDataUrl} alt={title} className="max-w-full max-h-full object-contain" />
      </div>
    </ModalShell>
  );
};

export default DiagramModal;