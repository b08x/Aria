import { GoogleGenAI, GenerateContentResponse, Content, Part } from "@google/genai";
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createMistral } from '@ai-sdk/mistral';
import { createAnthropic } from '@ai-sdk/anthropic';
import { streamText as vercelStreamText, generateText as vercelGenerateText, LanguageModel, CoreMessage } from 'ai';
import { Settings, Section, Message, Role, ApiKeyStatus, SearchResults, FileAttachment } from '../types';
import { PROVIDERS } from "../constants";

// --- Client & Model Instantiation ---

const getGoogleGenAIClient = (apiKey: string): GoogleGenAI => {
    if (!apiKey) throw new Error('API key is not configured.');
    return new GoogleGenAI({ apiKey });
};

const getLanguageModel = (settings: Settings): LanguageModel => {
    const { provider, apiKey, model } = settings;
    const providerConfig = PROVIDERS[provider];

    if (!apiKey) throw new Error('API key is not configured.');

    switch (providerConfig.api) {
        case 'google': {
            const google = createGoogleGenerativeAI({ apiKey });
            return google(model);
        }
        case 'openai': {
            const openai = createOpenAI({ apiKey });
            return openai(model);
        }
        case 'mistral': {
            const mistral = createMistral({ apiKey });
            return mistral(model);
        }
        case 'anthropic': {
            const anthropic = createAnthropic({ apiKey });
            return anthropic(model);
        }
        case 'openai_compatible': {
            const headers: Record<string, string> = {};
            
            return createOpenAI({
                baseURL: providerConfig.baseURL,
                apiKey,
                headers,
            })(model);
        }
        default:
            throw new Error(`Unsupported provider API type: ${(providerConfig as any).api}`);
    }
};

// --- API Key Validation ---

export const validateApiKey = async (settings: Settings): Promise<ApiKeyStatus> => {
    if (!settings.apiKey) return 'unverified';

    try {
        if (settings.provider === 'google') {
            const ai = getGoogleGenAIClient(settings.apiKey);
            await ai.models.generateContent({
                model: settings.model,
                contents: [{ role: 'user', parts: [{ text: 'validate' }] }],
            });
        } else if (settings.provider === 'mistral') {
            const url = 'https://api.mistral.ai/v1/models';
            const response = await fetch(url, { headers: { 'Authorization': `Bearer ${settings.apiKey}` } });
            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({}));
                const message = errorBody?.message || `Mistral API request failed with status ${response.status}`;
                const error: any = new Error(message);
                error.status = response.status;
                throw error;
            }
        } else {
            const model = getLanguageModel(settings);
            await vercelGenerateText({ model, prompt: 'validate' });
        }
        return 'valid';
    } catch (e: any) {
        console.error(`API Key validation failed for ${settings.provider}:`, e);
        const errorMessage = (e?.message || (e.cause as any)?.message || '').toLowerCase();
        const statusCode = e?.status || e?.statusCode || (e.cause as any)?.status;

        const isRateLimited = (
            errorMessage.includes('rate limit') ||
            errorMessage.includes('capacity exceeded') ||
            errorMessage.includes('quota') ||
            errorMessage.includes('service unavailable') ||
            statusCode === 429 ||
            statusCode === 500 ||
            statusCode === 503
        );

        if (isRateLimited) {
            return 'ratelimited';
        }
        return 'invalid';
    }
};


// --- Message & History Builders ---

const buildGoogleHistory = (messages: Message[]): Content[] => {
    return messages.map(msg => {
        let text = msg.content;
        if (msg.role === 'user' && msg.files && msg.files.length > 0) {
            const fileContents = msg.files.map(file =>
                `\n\n--- START OF FILE: ${file.name} ---\n${file.content}\n--- END OF FILE: ${file.name} ---`
            ).join('');
            text += fileContents;
        }
        return {
            role: msg.role === Role.ASSISTANT ? 'model' : 'user',
            parts: [{ text: text }],
        }
    });
};

const buildCoreMessages = (messages: Message[]): CoreMessage[] => {
    return messages.map((msg): CoreMessage => {
        if (msg.role === Role.USER) {
            let combinedContent = msg.content;
            if (msg.files && msg.files.length > 0) {
                const fileContents = msg.files.map(file => 
                    `\n\n--- START OF FILE: ${file.name} ---\n${file.content}\n--- END OF FILE: ${file.name} ---`
                ).join('');
                combinedContent += fileContents;
            }
            return { role: 'user', content: combinedContent };
        } else { // ASSISTANT
            return { role: 'assistant', content: msg.content };
        }
    });
};


// --- Streaming Chat ---

const streamTextVercel = async (
    settings: Settings,
    system: string,
    messages: Message[],
) => {
    const model = getLanguageModel(settings);
    const coreMessages = buildCoreMessages(messages);

    const result = await vercelStreamText({
        model,
        system,
        messages: coreMessages,
        temperature: settings.temperature,
        topP: settings.topP,
    });

    return {
        textStream: result.textStream,
        getFinalResponse: () => undefined,
    };
};

const streamTextGoogle = async (
    settings: Settings,
    system: string,
    messages: Message[],
): Promise<{ textStream: AsyncGenerator<string>; getFinalResponse: () => GenerateContentResponse | undefined }> => {
    const { apiKey, model: modelName, temperature, topP } = settings;
    const ai = getGoogleGenAIClient(apiKey);
    
    const contents = buildGoogleHistory(messages);

    if (contents.length > 0 && contents[contents.length - 1].role !== 'user') {
        throw new Error("Conversation history must end with a user message.");
    }

    let finalResponse: GenerateContentResponse | undefined;

    const stream = await ai.models.generateContentStream({
        model: modelName,
        contents,
        config: {
            systemInstruction: system,
            tools: [{ googleSearch: {} }],
            temperature,
            topP,
        }
    });

    async function* textStreamGenerator(): AsyncGenerator<string> {
        for await (const chunk of stream) {
            finalResponse = chunk;
            yield chunk.text;
        }
    }

    return { textStream: textStreamGenerator(), getFinalResponse: () => finalResponse };
};

export const streamText = (
    settings: Settings,
    system: string,
    messages: Message[],
) => {
    if (settings.provider === 'google') {
        return streamTextGoogle(settings, system, messages);
    }
    return streamTextVercel(settings, system, messages);
};


// --- Non-Streaming Generation ---

const generateTextGoogle = async (
    settings: Settings,
    prompt: string,
    systemInstruction?: string,
    responseMimeType?: "text/plain" | "application/json"
): Promise<string> => {
    const { apiKey, model: modelName, temperature, topP } = settings;
    const ai = getGoogleGenAIClient(apiKey);
    
    const config: any = {
        temperature,
        topP,
    };
    if (systemInstruction) {
        config.systemInstruction = systemInstruction;
    }
    if (responseMimeType) {
        config.responseMimeType = responseMimeType;
    }

    const response = await ai.models.generateContent({
        model: modelName,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config,
    });

    return response.text;
};

const generateText = async (
    settings: Settings,
    prompt: string,
    systemInstruction?: string,
    responseMimeType?: "text/plain" | "application/json"
): Promise<string> => {
    if (settings.provider === 'google') {
        return generateTextGoogle(settings, prompt, systemInstruction, responseMimeType);
    }

    const model = getLanguageModel(settings);
    const result = await vercelGenerateText({
        model,
        prompt,
        system: systemInstruction,
        ...(responseMimeType === 'application/json' && { mode: 'json' as const }),
    });
    return result.text;
};

const parseJsonFromText = (text: string): any => {
    let jsonStr = text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
        jsonStr = match[2].trim();
    }
    return JSON.parse(jsonStr);
};


// --- Model Discovery ---

export const fetchAvailableModels = async (settings: Settings): Promise<string[]> => {
    const { provider, apiKey } = settings;
    const providerConfig = PROVIDERS[provider];
    const defaultModels = providerConfig.models;

    if (!apiKey) {
        return defaultModels;
    }

    try {
        let fetchedModels: string[] = [];
        switch (provider) {
            case 'google': {
                const url = `https://generativelanguage.googleapis.com/v1beta/models`;
                const response = await fetch(url, {
                    headers: { 'x-goog-api-key': apiKey }
                });
                if (!response.ok) {
                    let message = `Google API request failed with status ${response.status}`;
                    try {
                        const errorData = await response.json();
                        if (errorData?.error?.message) {
                            message = errorData.error.message;
                        }
                    } catch (e) { /* ignore json parse error */ }
                    throw new Error(message);
                }
                const data = await response.json();
                fetchedModels = data.models
                    ?.filter((m: any) => m.supportedGenerationMethods?.includes('generateContent') && !m.name.includes('embedding'))
                    .map((m: any) => m.name.replace(/^models\//, '')) || [];
                break;
            }
            case 'openai':
            case 'openrouter': {
                const url = `${providerConfig.api === 'openai_compatible' ? providerConfig.baseURL : 'https://api.openai.com/v1'}/models`;
                const response = await fetch(url, { headers: { 'Authorization': `Bearer ${apiKey}` } });
                if (!response.ok) throw new Error(`OpenAI-compatible API request failed with status ${response.status}`);
                const data = await response.json();
                fetchedModels = data.data?.map((m: any) => m.id) || [];
                break;
            }
            case 'mistral': {
                const url = 'https://api.mistral.ai/v1/models';
                const response = await fetch(url, { headers: { 'Authorization': `Bearer ${apiKey}` } });
                if (!response.ok) throw new Error(`Mistral API request failed with status ${response.status}`);
                const data = await response.json();
                fetchedModels = data.data?.map((m: any) => m.id) || [];
                break;
            }
            case 'anthropic':
                // Anthropic doesn't have a public models list API, so we just use the default.
                return defaultModels;
            default:
                return defaultModels;
        }
        // Return a sorted union of default and fetched models.
        const combined = [...new Set([...defaultModels, ...fetchedModels])];
        return combined.sort((a, b) => a.localeCompare(b));

    } catch (error) {
        console.error(`Failed to fetch models for ${provider}:`, error);
        return defaultModels; // Fallback to default list on any error
    }
};

// --- ARIA Specific Functions ---
const CURRICULUM_SYSTEM_INSTRUCTION = `You are an expert curriculum designer. Your task is to generate a structured learning plan based on the user's request.
Respond ONLY with the curriculum in markdown format. Do not add any conversational text, introductions, or summaries.
The output must be a clean list of modules and lessons.
Use ## for major modules or topics. These are parent sections.
Use ### for individual lessons or sub-topics within a module. These are child sections.
Example:
## Module 1: Introduction
### Lesson 1.1: What is Python?
### Lesson 1.2: Setting up your environment
## Module 2: Core Concepts
### Lesson 2.1: Variables and Data Types`;

const DIAGRAM_SYSTEM_INSTRUCTION = `You are an expert diagramming assistant. Your task is to generate a Mermaid.js diagram based on the user's request.
**IMPORTANT RULES:**
1.  You MUST respond with a single, valid JSON object.
2.  The JSON object must have two keys: "title" (a concise, descriptive string for the diagram) and "code" (a string containing the Mermaid.js syntax).
3.  Inside the "code" string, all text within a diagram node MUST be enclosed in double quotes (e.g., A["This is node text"]).
4.  For line breaks inside a node's text, you MUST use the <br> tag. Do not use raw newline characters (\\n).
5.  Do not include any other text, explanations, or markdown formatting outside of the single JSON object.
Example Response:
{
  "title": "User Authentication Flow",
  "code": "graph TD\\n    A[\\"User Enters Credentials\\"] --> B{\\"Check Database\\"}\\n    B -->|\\"Valid\\"| C[\\"Access Granted\\"]\\n    B -->|\\"Invalid\\"| D[\\"Show Error Message<br>Try again\\"]"
}`;

export interface LessonIntroData {
    introduction: string;
    subtopics: string[];
    closing_question: string;
}

const LESSON_INTRO_SYSTEM_INSTRUCTION = `You are an AI Assistant kicking off a new lesson. Your response must be a single, valid JSON object.
The JSON object must have three keys:
1. "introduction": A string containing a brief, engaging one-paragraph introduction to the topic.
2. "subtopics": An array of strings, where each string is a key concept or skill the user will learn (2-4 items).
3. "closing_question": A string for a concluding question to prompt the user for input.

Do not include any other text, explanations, or markdown formatting outside of the single JSON object.
Example Response:
{
  "introduction": "Welcome to our lesson on Chunking! We'll explore how this fundamental concept from cognitive psychology can be applied to text processing to make sense of large amounts of information.",
  "subtopics": [
    "Understanding Chunking in Cognitive Psychology",
    "Applying Chunking to Text Processing",
    "Practical Examples of Chunking"
  ],
  "closing_question": "Does this sound like a good plan to start with?"
}`;

const parseSectionsFromMarkdown = (content: string): Section[] => {
    const sections: Section[] = [];
    const lines = content.split('\n');
    let parentModule: Section | null = null;

    lines.forEach(line => {
        const h2Match = line.match(/^##\s+(.*)/);
        const h3Match = line.match(/^###\s+(.*)/);

        if (h2Match) {
            const title = h2Match[1].trim();
            const id = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${sections.length}`;
            const newModule: Section = { id, title, level: 2, hasContent: false };
            sections.push(newModule);
            parentModule = newModule;
        } else if (h3Match && parentModule) {
            const title = h3Match[1].trim();
            const id = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${sections.length}`;
            sections.push({ id, title, level: 3 });
            parentModule.hasContent = true; // Mark the parent module as having lessons
        }
    });

    return sections;
};

export async function generateCurriculum(topic: string, files: FileAttachment[], settings: Settings): Promise<Section[]> {
    let prompt = `Generate a curriculum for: ${topic}`;

    if (files.length > 0) {
        const fileContent = files.map(f => `--- START OF FILE: ${f.name} ---\n${f.content}\n--- END OF FILE: ${f.name} ---`).join('\n\n');
        prompt += `\n\nBase the curriculum on the following source material:\n${fileContent}`;
    }

    const text = await generateText(settings, prompt, CURRICULUM_SYSTEM_INSTRUCTION);
    if (!text) throw new Error("Failed to generate curriculum. The model returned an empty response.");
    const sections = parseSectionsFromMarkdown(text);
    if (sections.length === 0) throw new Error("Could not parse a curriculum from the model's response.");
    return sections;
}

export async function generateTopicFromFiles(files: FileAttachment[], settings: Settings): Promise<string> {
    const systemInstruction = "Based on the content of the following documents, suggest a concise and descriptive topic title (5-10 words) for a learning curriculum. Respond with only the title text, nothing else. Do not include quotes or any other formatting.";

    const fileContent = files.map(f => `--- START OF FILE: ${f.name} ---\n${f.content}\n--- END OF FILE: ${f.name} ---`).join('\n\n');
    const prompt = `Here is the content of the uploaded files:\n${fileContent}`;
    
    const text = await generateText(settings, prompt, systemInstruction);
    return text.trim().replace(/["']/g, ''); // Clean up any quotes
}

export async function generateQuiz(moduleContext: string, chatHistory: Message[], settings: Settings): Promise<string> {
    const historySummary = chatHistory.slice(-10).map(m => `${m.role}: ${m.content}`).join('\n');
    const prompt = `Based on the topic "${moduleContext}" and the recent conversation history, generate a short, 3-question multiple-choice quiz to test understanding.
**FORMATTING RULES:**
1. Provide the questions in Markdown format.
2. The question text itself must be bold (e.g., **"1. What is the capital of France?"**).
3. The correct answer must be indicated with an asterisk (*).
4. Do not provide any introductory or concluding text, only the quiz itself.

Recent history:
${historySummary}`;
    return await generateText(settings, prompt);
}

export async function generateDiagramData(prompt: string, settings: Settings): Promise<{ title: string, code: string }> {
    const text = await generateText(settings, prompt, DIAGRAM_SYSTEM_INSTRUCTION, "application/json");
    try {
        let data = parseJsonFromText(text);
        // Sometimes the model wraps the object in an array.
        if (Array.isArray(data) && data.length > 0) {
            data = data[0];
        }
        if (typeof data.title === 'string' && typeof data.code === 'string') {
            return data;
        }
        throw new Error("Invalid JSON structure received from model.");
    } catch (e) {
        console.error("Failed to parse JSON for diagram:", text);
        throw new Error("The AI returned an invalid format for the diagram data.");
    }
}

export async function generateLessonIntro(topic: string, settings: Settings): Promise<LessonIntroData> {
    const prompt = `The topic is: "${topic}"`;
    const text = await generateText(settings, prompt, LESSON_INTRO_SYSTEM_INSTRUCTION, "application/json");
    try {
        let data = parseJsonFromText(text);
        // Sometimes the model wraps the object in an array.
        if (Array.isArray(data) && data.length > 0) {
            data = data[0];
        }
        if (typeof data.introduction === 'string' && Array.isArray(data.subtopics) && typeof data.closing_question === 'string') {
            return data;
        }
         if (typeof data.introduction === 'string' && Array.isArray(data.subtopics)) { // Handle case where closing_question is missing
            return { ...data, closing_question: "Ready to dive in?" };
        }
        throw new Error("Invalid JSON structure for lesson intro.");
    } catch (e) {
        console.error("Failed to parse JSON for lesson intro:", text, e);
        // Fallback for models that fail to produce valid JSON
        return {
            introduction: text,
            subtopics: [],
            closing_question: "Shall we begin?"
        };
    }
}

export async function generateImage(prompt: string, settings: Settings): Promise<string> {
    if (settings.provider !== 'google') {
        throw new Error('Image generation is currently only available with the Google provider.');
    }
    if (!settings.apiKey) {
        throw new Error('Google API key is not configured.');
    }
    const ai = getGoogleGenAIClient(settings.apiKey);
    
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: { numberOfImages: 1, outputMimeType: 'image/png' },
        });

        if (!response.generatedImages || response.generatedImages.length === 0 || !response.generatedImages[0].image.imageBytes) {
            throw new Error("The model did not return a valid image.");
        }

        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        return `data:image/png;base64,${base64ImageBytes}`;
    } catch (e: any) {
        console.error("Image generation failed:", e);
        throw new Error(e.message || "An unexpected error occurred while generating the image.");
    }
}

// --- Google Custom Search ---

export const fetchSearchResults = async (
    query: string,
    apiKey: string,
    cseId: string,
): Promise<SearchResults> => {
    if (!apiKey || !cseId) {
        throw new Error("Google Custom Search API Key or Search Engine ID is not configured.");
    }

    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}&q=${encodeURIComponent(query)}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json();
            const message = errorData.error?.message || `Request failed with status ${response.status}`;
            throw new Error(message);
        }
        const data = await response.json();
        return data as SearchResults;
    } catch (e: any) {
        console.error("Google Custom Search API error:", e);
        throw new Error(e.message || "An unexpected error occurred while fetching search results.");
    }
};