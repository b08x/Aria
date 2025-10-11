import * as pdfjs from 'pdfjs-dist';
import mammoth from 'mammoth';
import { FileAttachment } from "./types";

// Set worker path for pdf.js. This is crucial for it to work from a CDN.
pdfjs.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.5.136/build/pdf.worker.mjs`;

const readTextFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as text.'));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
};

const readPdfFile = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    let textContent = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const text = await page.getTextContent();
        textContent += text.items.map(item => ('str' in item ? item.str : '')).join(' ') + '\n';
    }
    return textContent;
};

const readDocxFile = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const { value } = await mammoth.extractRawText({ arrayBuffer });
    return value || '';
};

export const processFile = async (file: File): Promise<FileAttachment> => {
    let content = '';
    const extension = file.name.split('.').pop()?.toLowerCase();
    const mimeType = file.type;

    if (extension === 'pdf' || mimeType === 'application/pdf') {
        content = await readPdfFile(file);
    } else if (extension === 'docx' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        content = await readDocxFile(file);
    } else if (['txt', 'md', 'csv'].includes(extension || '') || mimeType.startsWith('text/')) {
        content = await readTextFile(file);
    } else {
        throw new Error(`Unsupported file type: .${extension || 'unknown'}`);
    }
    
    return {
        name: file.name,
        type: file.type,
        content: content.trim(),
    };
};
