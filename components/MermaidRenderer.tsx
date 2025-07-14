

import React, { useEffect, useState, memo } from 'react';
import mermaid from 'mermaid';

interface MermaidRendererProps {
  id: string;
  code: string;
  onRender: (svg: string, id: string) => void;
}

const MermaidRenderer: React.FC<MermaidRendererProps> = ({ id, code, onRender }) => {
  const [error, setError] = useState<string | null>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  
  useEffect(() => {
    const renderDiagram = async () => {
      try {
        setError(null);
        if (typeof code !== 'string' || !code.trim()) {
            setSvgContent('');
            return;
        }

        const { svg } = await mermaid.render(id, code);
        setSvgContent(svg);
        onRender(svg, id);

      } catch (e: any) {
        console.error("Mermaid rendering error:", e.message);
        setError("Invalid Diagram Syntax. Please try generating it again.");
        setSvgContent('');
      }
    };
    renderDiagram();
  }, [id, code, onRender]);

  return (
    <div className="mermaid-container my-4 p-4 bg-background/50 rounded-lg border border-primary/20">
      {error ? (
        <div className="p-4 text-red-800 bg-red-100 rounded-md">
            <p className="font-bold">Diagram Error</p>
            <p>{error}</p>
        </div>
      ) : (
        <div 
            id={`container-${id}`} 
            className="flex justify-center items-center"
            dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      )}
    </div>
  );
};

export default memo(MermaidRenderer);