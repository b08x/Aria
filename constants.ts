

import { Settings, SFLConfig } from './types';

export const PROVIDERS = {
  google: {
    name: 'Google',
    models: ['gemini-2.5-flash-preview-04-17'],
    api: 'google' as const,
  },
  openai: {
    name: 'OpenAI',
    models: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    api: 'openai' as const,
  },
  anthropic: {
    name: 'Anthropic',
    models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
    api: 'anthropic' as const,
  },
  mistral: {
    name: 'Mistral',
    models: ['mistral-large-latest', 'mistral-small-latest', 'open-mixtral-8x22b'],
    api: 'mistral' as const,
  },
  openrouter: {
    name: 'OpenRouter',
    models: [
        'openai/gpt-3.5-turbo',
        'openai/gpt-4o',
        'mistralai/mistral-large-latest',
        'google/gemini-flash-1.5',
        'anthropic/claude-3-opus-20240229',
        'meta-llama/llama-3-70b-instruct'
    ],
    api: 'openrouter' as const,
  },
};


export const INITIAL_SETTINGS: Settings = {
  provider: 'google',
  apiKey: '',
  model: PROVIDERS.google.models[0],
  temperature: 0.7,
  topP: 1.0,
  ttsEnabled: false,
  elevenLabsApiKey: '',
  elevenLabsVoiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel
  googleCseApiKey: '',
  googleCseId: '',
};

export const MODEL_GUIDE: Record<string, {name: string, description: string, strengths: string}> = {
    'gemini-2.5-flash-preview-04-17': {
        name: 'Gemini 2.5 Flash',
        description: 'A lightweight, fast, and cost-efficient model ideal for high-frequency tasks, summarization, and chat applications where speed is critical.',
        strengths: 'Best for: Rapid-fire chat, document summarization, and tasks where low latency is more important than deep, nuanced reasoning.'
    },
    'gpt-4o': {
        name: 'GPT-4o',
        description: "OpenAI's latest and most advanced model, with excellent multimodal capabilities and a native understanding of text, audio, and images.",
        strengths: 'Best for: Complex reasoning, creative text generation, and any task requiring top-tier intelligence and multimodality.'
    },
    'gpt-4-turbo': {
        name: 'GPT-4 Turbo',
        description: 'A powerful large language model with a large context window, optimized for performance and complex instruction-following.',
        strengths: 'Best for: In-depth analysis of large documents, complex coding tasks, and advanced instruction-following.'
    },
    'gpt-3.5-turbo': {
        name: 'GPT-3.5 Turbo',
        description: "A fast and reliable model that's a great balance between cost, speed, and performance for a wide variety of tasks.",
        strengths: 'Best for: General-purpose chat, content generation, and everyday tasks that need a quick and capable response.'
    },
    'claude-3-opus-20240229': {
        name: 'Claude 3 Opus',
        description: "Anthropic's most powerful model, delivering state-of-the-art performance on highly complex tasks and demonstrating deep understanding.",
        strengths: 'Best for: Research analysis, strategic thinking, and tasks requiring a nuanced understanding of context and relationships.'
    },
    'claude-3-sonnet-20240229': {
        name: 'Claude 3 Sonnet',
        description: 'An ideal balance of intelligence and speed, designed for enterprise workloads and scaled AI deployments.',
        strengths: 'Best for: Data processing, code generation, and quality control. A great workhorse for most business needs.'
    },
    'claude-3-haiku-20240307': {
        name: 'Claude 3 Haiku',
        description: "Anthropic's fastest and most compact model, designed for near-instant responsiveness and seamless AI experiences.",
        strengths: 'Best for: Customer support chats, content moderation, and tasks where immediate response time is paramount.'
    },
    'mistral-large-latest': {
        name: 'Mistral Large',
        description: "Mistral's flagship model, offering top-tier reasoning capabilities for complex tasks.",
        strengths: 'Best for: Complicated reasoning, code generation, and multilingual tasks.'
    },
    'mistral-small-latest': {
        name: 'Mistral Small',
        description: 'A fast and cost-effective model for high-throughput workloads.',
        strengths: 'Best for: Simple tasks, summarization, and chat applications where low latency is key.'
    },
    'open-mixtral-8x22b': {
        name: 'Mixtral 8x22B',
        description: 'A high-performance sparse Mixture-of-Experts (SMoE) model with a large context window.',
        strengths: 'Best for: High-throughput tasks requiring a large context, like document analysis and retrieval augmented generation (RAG).'
    },
    'mistralai/mistral-large-latest': {
        name: 'Mistral Large (OpenRouter)',
        description: "Mistral's flagship model accessed via OpenRouter, offering top-tier reasoning capabilities.",
        strengths: 'Best for: Complex reasoning, code generation, and leveraging OpenRouter\'s ecosystem.'
    },
    'google/gemini-flash-1.5': {
        name: 'Gemini 1.5 Flash (OpenRouter)',
        description: "Google's fast and versatile multimodal model, accessed via OpenRouter.",
        strengths: 'Best for: Rapid chat, summarization, and multimodal tasks via a unified API.'
    },
    'openai/gpt-3.5-turbo': {
        name: 'GPT-3.5 Turbo (OpenRouter)',
        description: "A fast and reliable model that's a great balance between cost, speed, and performance, accessed via OpenRouter.",
        strengths: 'Best for: General-purpose chat, content generation, and everyday tasks via OpenRouter\'s ecosystem.'
    },
    'openai/gpt-4o': {
        name: 'GPT-4o (OpenRouter)',
        description: 'The latest flagship model from OpenAI, accessed via OpenRouter.',
        strengths: 'Best for: Top-tier intelligence, multimodality, and leveraging OpenRouter\'s ecosystem.'
    },
    'anthropic/claude-3-opus-20240229': {
        name: 'Claude 3 Opus (OpenRouter)',
        description: "Anthropic's most powerful model via OpenRouter, excelling at complex analysis and strategic tasks.",
        strengths: 'Best for: Research, strategic analysis, and tasks requiring deep contextual understanding.'
    },
    'meta-llama/llama-3-70b-instruct': {
        name: 'Llama 3 70B Instruct (OpenRouter)',
        description: "Meta's powerful 70-billion parameter instruction-tuned model, accessed via OpenRouter.",
        strengths: 'Best for: Nuanced text generation, coding, and following complex instructions.'
    },
};


export const ELEVENLABS_VOICES = [
    { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel" },
    { id: "29vD33N1CtxCmqQRPO9t", name: "Drew" },
    { id: "5Q0t7uMcjvnagumLfvZi", name: "Clyde" },
    { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi" },
    { id: "CYw3kZ02Hs0563khs1Fj", name: "Dave" },
    { id: "D38z5RcWu1voky8WS1ja", name: "Fin" },
    { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah" },
    { id: "ErXwobaYiN019PkySvjV", name: "Antoni" },
];

// --- SFL Constants ---

export const TASK_TYPES = [
    'General Query',
    'Summarization',
    'Code Generation',
    'Translation',
    'Creative Writing',
    'Lesson Planning',
] as const;

export const AI_PERSONAS = [
    'Friendly AI Assistant',
    'Socratic Questioner',
    'Expert Academic',
    'Creative Collaborator',
    'Supportive Mentor',
] as const;

export const TARGET_AUDIENCES = [
    'Absolute Beginner',
    'High School Student',
    'University Student',
    'Industry Professional',
    'Curious Layperson',
] as const;

export const DESIRED_TONES = [
    'Formal',
    'Informal',
    'Enthusiastic',
    'Objective',
    'Humorous',
    'Encouraging',
] as const;

export const OUTPUT_FORMATS = [
    'Plain Text',
    'Markdown',
    'JSON',
    'Bulleted List',
    'Step-by-step Guide',
] as const;

export const LENGTH_CONSTRAINTS = [
    'Very Short (1-2 sentences)',
    'Short (1 paragraph)',
    'Medium (2-3 paragraphs)',
    'Long (4+ paragraphs)',
    'No Constraint',
] as const;

export const DEFAULT_SFL_CONFIG: SFLConfig = {
    sflField: {
        topic: '',
        taskType: 'General Query',
        domainSpecifics: '',
        keywords: '',
    },
    sflTenor: {
        aiPersona: 'Friendly AI Assistant',
        targetAudience: 'University Student',
        desiredTone: 'Encouraging',
        interpersonalStance: '',
    },
    sflMode: {
        outputFormat: 'Markdown',
        lengthConstraint: 'No Constraint',
        rhetoricalStructure: '',
        textualDirectives: '',
    },
};