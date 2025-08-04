
import { PROVIDERS } from "./constants";

export type Provider = keyof typeof PROVIDERS;
export type ApiKeyStatus = 'unverified' | 'valid' | 'invalid' | 'ratelimited';

export enum Role {
  USER = 'user',
  ASSISTANT = 'assistant',
}

export interface Settings {
  provider: Provider;
  apiKey: string;
  model: string;
  temperature: number;
  topP: number;
  ttsEnabled: boolean;
  elevenLabsApiKey: string;
  elevenLabsVoiceId: string;
  googleCseApiKey: string;
  googleCseId: string;
}

export interface FileAttachment {
  name: string;
  type: string;
  content: string;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  files?: FileAttachment[];
  groundingMetadata?: any[];
  image?: {
    url: string;
    prompt: string;
  };
  subtopics?: { text: string; completed: boolean }[];
}

export interface TTSPlayback {
  isPlaying: boolean;
  messageId: string | null;
  audio: HTMLAudioElement | null;
}

// --- ARIA Specific Types ---

export interface Section {
  id: string;
  title: string;
  level: number;
  hasContent?: boolean;
}

export interface Curriculum {
  sections: Section[];
  relatedTopics: string[];
}


export interface SFLConfig {
  sflField: {
      topic?: string;
      taskType?: string;
      domainSpecifics?:string;
      keywords?: string;
  };
  sflTenor: {
      aiPersona?: string;
      targetAudience?: string;
      desiredTone?: string;
      interpersonalStance?: string;
  };
  sflMode: {
      outputFormat?: string;
      lengthConstraint?: string;
      rhetoricalStructure?: string;
      textualDirectives?: string;
  };
}

export interface SavedDiagram {
    id: string;
    title: string;
    pngDataUrl: string;
    sourceText: string;
}

// --- Research Panel Types ---
export interface SearchResultItem {
  title: string;
  link: string;
  snippet: string;
  pagemap?: {
    cse_thumbnail?: { src: string }[];
    metatags?: { 'og:image': string }[];
  };
}

export interface SearchResults {
  items?: SearchResultItem[];
}


// Deprecated type, but keeping for compatibility if old logic is reused
export interface GeminiHistoryEntry {
  role: 'user' | 'model';
  parts: { text: string }[];
}