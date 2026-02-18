# Ollama Integration

Complete Ollama integration for React 18 + Vite applications with qwen3-vl:2b model support.

## Prerequisites

1. Install Ollama: https://ollama.com
2. Pull the model:
```bash
ollama pull qwen3-vl:2b
```
3. Start Ollama server:
```bash
ollama serve
```

## Installation

The integration uses axios for HTTP requests (already in your project).

## Configuration

Add to your `.env` file:

```env
# Ollama Configuration
VITE_OLLAMA_URL=http://localhost:11434
VITE_OLLAMA_MODEL=qwen3-vl:2b
```

## Quick Start

### Basic Text Generation

```jsx
import { useOllamaGenerate } from './hooks/useOllama';

const MyComponent = () => {
  const { response, isLoading, error, generate } = useOllamaGenerate();

  const handleGenerate = async () => {
    await generate('Explain quantum computing in simple terms');
  };

  return (
    <div>
      <button onClick={handleGenerate} disabled={isLoading}>
        Generate
      </button>
      {response && <p>{response}</p>}
    </div>
  );
};
```

### Chat Interface

```jsx
import { useOllamaChat } from './hooks/useOllama';

const ChatComponent = () => {
  const { messages, isLoading, sendMessage } = useOllamaChat();

  return (
    <div>
      {messages.map((msg, idx) => (
        <div key={idx}>
          <strong>{msg.role}:</strong> {msg.content}
        </div>
      ))}
      <input 
        onKeyPress={(e) => {
          if (e.key === 'Enter') sendMessage(e.target.value);
        }}
      />
    </div>
  );
};
```

### Vision Analysis

```jsx
import { useOllamaVision } from './hooks/useOllama';

const VisionComponent = () => {
  const { response, isLoading, analyze } = useOllamaVision();

  const handleImage = async (file) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result.split(',')[1];
      await analyze('Describe this image', base64);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={(e) => handleImage(e.target.files[0])} />
      {response && <p>{response}</p>}
    </div>
  );
};
```

## Available Hooks

- `useOllamaGenerate()` - Single text generation
- `useOllamaStream()` - Streaming text generation
- `useOllamaChat()` - Conversation/chat
- `useOllamaVision()` - Image analysis
- `useOllamaStatus()` - Check server status and models

## Pre-built Components

Import ready-to-use components:

```jsx
import { OllamaTextGenerator, OllamaChat, OllamaVision } from './components/ollama/OllamaComponents';

function App() {
  return (
    <div>
      <OllamaTextGenerator />
      <OllamaChat />
      <OllamaVision />
    </div>
  );
}
```

## Service API

Direct service usage:

```javascript
import { ollamaService } from './services/ollama';

// Generate text
const response = await ollamaService.generate('Your prompt');

// Chat
const chatResponse = await ollamaService.chat([
  { role: 'user', content: 'Hello' }
]);

// Vision
const visionResponse = await ollamaService.vision(
  'Describe this',
  base64Image
);
```

## File Structure

```
src/
├── services/
│   └── ollama/
│       ├── index.js              # Exports
│       ├── ollamaService.js      # Core API client
│       └── ollamaConfig.js       # Configuration
├── hooks/
│   └── useOllama.js              # React hooks
└── components/
    └── ollama/
        └── OllamaComponents.jsx  # UI components
```

## Troubleshooting

**Ollama not available**: Ensure Ollama is running with `ollama serve`

**Model not found**: Run `ollama pull qwen3-vl:2b`

**CORS errors**: Configure Ollama CORS or use a proxy in development
