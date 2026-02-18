/**
 * Ollama Configuration
 * 
 * Configuration settings for Ollama integration.
 * Default model: qwen3-vl:2b
 */

export const OLLAMA_CONFIG = {
  // Server configuration
  server: {
    baseUrl: import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434',
    timeout: 30000,
    retries: 3
  },

  // Default model settings
  model: {
    name: import.meta.env.VITE_OLLAMA_MODEL || 'qwen3-vl:2b',
    // qwen3-vl:2b specific options
    options: {
      temperature: 0.7,
      top_p: 0.9,
      top_k: 40,
      num_predict: 2048,
      repeat_penalty: 1.1
    }
  },

  // Model capabilities
  capabilities: {
    vision: true,      // qwen3-vl:2b supports vision
    chat: true,        // Supports chat format
    streaming: true    // Supports streaming responses
  },

  // UI settings
  ui: {
    maxPromptLength: 4000,
    maxImageSize: 10 * 1024 * 1024, // 10MB
    supportedImageFormats: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    defaultPrompts: {
      vision: 'Describe this image in detail',
      text: 'Explain this concept',
      chat: 'Hello! How can you help me today?'
    }
  }
};

/**
 * Check if running in development mode
 */
export const isDevelopment = import.meta.env.DEV;

/**
 * Validate configuration
 * @returns {Object} Validation result
 */
export const validateConfig = () => {
  const errors = [];
  const warnings = [];

  // Check required environment variables
  if (!OLLAMA_CONFIG.server.baseUrl) {
    errors.push('Ollama base URL not configured');
  }

  if (!OLLAMA_CONFIG.model.name) {
    errors.push('Ollama model not configured');
  }

  // Warn about defaults in production
  if (!isDevelopment) {
    if (OLLAMA_CONFIG.server.baseUrl === 'http://localhost:11434') {
      warnings.push('Using default localhost URL in production');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

export default OLLAMA_CONFIG;
