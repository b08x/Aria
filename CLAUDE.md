# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `npm run dev` - Starts Vite development server
- **Build production**: `npm run build` - Builds the application for production
- **Preview build**: `npm run preview` - Serves the production build locally

## Environment Setup

Set the `GEMINI_API_KEY` environment variable in `.env.local` for Google API integration.

## Architecture Overview

This is a React/TypeScript application called **ARIA** (Adaptive Research & Information Assistant) - an AI-powered educational platform with multi-provider support.

### Core Architecture

- **Frontend**: React 19 with TypeScript, built using Vite
- **AI Integration**: Multi-provider support via Vercel AI SDK (`ai` package) and native Google GenAI SDK
- **State Management**: React hooks with local state (no external state library)
- **Styling**: CSS-in-JS with CSS modules approach
- **Components**: Modular React components in `/components` directory

### Key Application Flow

1. **Landing Page** → **Provider Setup** → **SFL Configuration** → **Main Interface**
2. Users configure AI providers (Google, OpenAI, Anthropic, Mistral, OpenRouter)
3. SFL (Systemic Functional Linguistics) wizard configures persona and output style
4. Main interface provides chat, curriculum generation, and research panels

### Multi-Provider AI System

The application abstracts AI providers through two main approaches:

- **Vercel AI SDK** (`aiService.ts:getLanguageModel`) - Used for OpenAI, Anthropic, Mistral, OpenRouter
- **Native Google GenAI SDK** (`aiService.ts:streamTextGoogle`) - Used for Google Gemini to preserve grounding metadata

Provider configuration is centralized in `constants.ts:PROVIDERS` with API type mapping.

### Key Features

- **Curriculum Generation** - AI-generated learning modules with structured sections
- **Research Integration** - Google Custom Search API integration for real-time information
- **Diagram Generation** - Mermaid.js diagram creation from text prompts
- **Text-to-Speech** - ElevenLabs integration for audio playback
- **File Attachments** - Support for image and document uploads
- **Multi-Session Management** - Checkpoint system for different learning topics

### State Architecture

- **Global App State**: Settings, curriculum, checkpoints, diagrams
- **Session Management**: `checkpoints` object maps session IDs to message arrays
- **Context Switching**: Dynamic system prompt generation based on current lesson context

### API Integration Patterns

- **Streaming Responses**: Uses async generators for real-time AI responses
- **Error Handling**: Comprehensive error classification (invalid, rate-limited, etc.)
- **Provider Validation**: Automated API key testing with provider-specific error parsing

### Component Organization

- **Layout Components**: `Sidebar`, `ChatPanel`, `ResearchPanel`
- **Modal Components**: `DiagramModal`, `SettingsModal`
- **Feature Components**: `SFLWizardPage`, `ProviderSetupPage`
- **UI Components**: Icon set in `/components/icons`

### Data Flow

1. User interactions in components trigger handlers in `App.tsx`
2. Handlers call service functions in `/services`
3. Services interact with external APIs and return structured data
4. State updates trigger re-renders across component tree

## Important Implementation Details

- **Type Safety**: Comprehensive TypeScript types in `types.ts`
- **Configuration Management**: Centralized constants in `constants.ts`
- **Path Aliases**: `@/*` maps to project root via tsconfig and vite config
- **API Key Security**: Environment variables for sensitive data, never committed
- **Google-Specific Features**: Search grounding and image generation only available with Google provider