import React, { useState } from 'react';
import { useOllamaGenerate, useOllamaChat, useOllamaVision, useOllamaStatus } from '../../hooks/useOllama';

/**
 * Simple text generation component
 */
export const OllamaTextGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const { response, isLoading, error, isAvailable, generate } = useOllamaGenerate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    await generate(prompt);
  };

  if (!isAvailable) {
    return (
      <div className="alert alert-warning">
        Ollama server not available. Please start Ollama and ensure qwen3-vl:2b model is installed.
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h5>Text Generation (qwen3-vl:2b)</h5>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <textarea
              className="form-control"
              rows="3"
              placeholder="Enter your prompt..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isLoading || !prompt.trim()}
          >
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Generating...
              </>
            ) : 'Generate'}
          </button>
        </form>

        {error && (
          <div className="alert alert-danger mt-3">
            Error: {error}
          </div>
        )}

        {response && (
          <div className="mt-4">
            <h6>Response:</h6>
            <div className="p-3 bg-light rounded" style={{ whiteSpace: 'pre-wrap' }}>
              {response}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Chat interface component
 */
export const OllamaChat = () => {
  const [input, setInput] = useState('');
  const { messages, isLoading, error, sendMessage, clearChat } = useOllamaChat();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    await sendMessage(input);
    setInput('');
  };

  return (
    <div className="card" style={{ height: '600px' }}>
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Chat with qwen3-vl:2b</h5>
        <button className="btn btn-sm btn-outline-secondary" onClick={clearChat}>
          Clear
        </button>
      </div>
      <div className="card-body d-flex flex-column" style={{ overflow: 'hidden' }}>
        <div className="flex-grow-1 overflow-auto mb-3">
          {messages.length === 0 ? (
            <div className="text-muted text-center py-5">
              Start a conversation with the AI
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`mb-3 ${msg.role === 'user' ? 'text-end' : ''}`}
              >
                <div className={`d-inline-block p-3 rounded ${
                  msg.role === 'user' 
                    ? 'bg-primary text-white' 
                    : 'bg-light'
                }`} style={{ maxWidth: '80%', textAlign: 'left' }}>
                  <strong>{msg.role === 'user' ? 'You' : 'AI'}:</strong>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="text-muted">
              <span className="spinner-border spinner-border-sm me-2"></span>
              AI is thinking...
            </div>
          )}
        </div>

        {error && (
          <div className="alert alert-danger">
            Error: {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="d-flex gap-2">
          <input
            type="text"
            className="form-control"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isLoading || !input.trim()}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

/**
 * Image analysis component (Vision)
 */
export const OllamaVision = () => {
  const [prompt, setPrompt] = useState('Describe this image in detail');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const { response, isLoading, error, analyze } = useOllamaVision();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result.split(',')[1];
      await analyze(prompt, base64);
    };
    reader.readAsDataURL(image);
  };

  return (
    <div className="card">
      <div className="card-header">
        <h5>Vision Analysis (qwen3-vl:2b)</h5>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <input
              type="file"
              className="form-control"
              accept="image/*"
              onChange={handleImageChange}
              disabled={isLoading}
            />
          </div>

          {imagePreview && (
            <div className="mb-3">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="img-fluid rounded"
                style={{ maxHeight: '300px' }}
              />
            </div>
          )}

          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="What would you like to know about this image?"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isLoading || !image}
          >
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Analyzing...
              </>
            ) : 'Analyze Image'}
          </button>
        </form>

        {error && (
          <div className="alert alert-danger mt-3">
            Error: {error}
          </div>
        )}

        {response && (
          <div className="mt-4">
            <h6>Analysis:</h6>
            <div className="p-3 bg-light rounded" style={{ whiteSpace: 'pre-wrap' }}>
              {response}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Ollama status checker component
 */
export const OllamaStatus = () => {
  const { isAvailable, models, isLoading, refresh } = useOllamaStatus();

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Ollama Status</h5>
        <button className="btn btn-sm btn-outline-primary" onClick={refresh}>
          Refresh
        </button>
      </div>
      <div className="card-body">
        {isLoading ? (
          <div className="text-center">
            <span className="spinner-border"></span>
          </div>
        ) : (
          <>
            <div className="mb-3">
              <strong>Status:</strong>{' '}
              <span className={`badge ${isAvailable ? 'bg-success' : 'bg-danger'}`}>
                {isAvailable ? 'Connected' : 'Not Available'}
              </span>
            </div>

            {isAvailable && (
              <div>
                <strong>Available Models:</strong>
                <ul className="list-group mt-2">
                  {models.length === 0 ? (
                    <li className="list-group-item text-muted">No models installed</li>
                  ) : (
                    models.map((model) => (
                      <li key={model.name} className="list-group-item d-flex justify-content-between">
                        <span>{model.name}</span>
                        <small className="text-muted">{model.size}</small>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default {
  OllamaTextGenerator,
  OllamaChat,
  OllamaVision,
  OllamaStatus
};
