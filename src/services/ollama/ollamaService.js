/**
 * Ollama API Service
 * 
 * Provides integration with local Ollama instance for AI capabilities.
 * Supports qwen3-vl:2b model for vision-language tasks.
 */

import axios from 'axios';

const DEFAULT_CONFIG = {
  baseUrl: 'http://localhost:11434',
  model: 'qwen3-vl:2b',
  defaultOptions: {
    temperature: 0.7,
    top_p: 0.9,
    top_k: 40,
    num_predict: 2048
  }
};

class OllamaService {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.client = axios.create({
      baseURL: this.config.baseUrl,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Check if Ollama server is available
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    try {
      const response = await this.client.get('/api/tags');
      return response.status === 200;
    } catch (error) {
      console.error('Ollama server not available:', error.message);
      return false;
    }
  }

  /**
   * Get list of available models
   * @returns {Promise<Array>}
   */
  async listModels() {
    try {
      const response = await this.client.get('/api/tags');
      return response.data.models || [];
    } catch (error) {
      console.error('Failed to list models:', error.message);
      throw error;
    }
  }

  /**
   * Check if specific model is available
   * @param {string} modelName 
   * @returns {Promise<boolean>}
   */
  async isModelAvailable(modelName = this.config.model) {
    try {
      const models = await this.listModels();
      return models.some(m => m.name === modelName);
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate completion from text prompt
   * @param {string} prompt 
   * @param {Object} options 
   * @returns {Promise<string>}
   */
  async generate(prompt, options = {}) {
    const requestBody = {
      model: this.config.model,
      prompt,
      stream: false,
      options: { ...this.config.defaultOptions, ...options }
    };

    try {
      const response = await this.client.post('/api/generate', requestBody);
      return response.data.response;
    } catch (error) {
      console.error('Generation failed:', error.message);
      throw error;
    }
  }

  /**
   * Generate completion with streaming
   * @param {string} prompt 
   * @param {Function} onChunk - Callback for each chunk
   * @param {Object} options 
   * @returns {Promise<string>}
   */
  async generateStream(prompt, onChunk, options = {}) {
    const requestBody = {
      model: this.config.model,
      prompt,
      stream: true,
      options: { ...this.config.defaultOptions, ...options }
    };

    try {
      const response = await this.client.post('/api/generate', requestBody, {
        responseType: 'stream'
      });

      let fullResponse = '';

      response.data.on('data', (chunk) => {
        const lines = chunk.toString().split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.response) {
              fullResponse += data.response;
              onChunk(data.response, fullResponse);
            }
            if (data.done) break;
          } catch (e) {
            console.warn('Failed to parse chunk:', line);
          }
        }
      });

      return new Promise((resolve) => {
        response.data.on('end', () => resolve(fullResponse));
      });
    } catch (error) {
      console.error('Streaming generation failed:', error.message);
      throw error;
    }
  }

  /**
   * Chat completion (for conversation)
   * @param {Array} messages - Array of {role, content} objects
   * @param {Object} options 
   * @returns {Promise<Object>}
   */
  async chat(messages, options = {}) {
    const requestBody = {
      model: this.config.model,
      messages,
      stream: false,
      options: { ...this.config.defaultOptions, ...options }
    };

    try {
      const response = await this.client.post('/api/chat', requestBody);
      return response.data;
    } catch (error) {
      console.error('Chat failed:', error.message);
      throw error;
    }
  }

  /**
   * Vision-language task with qwen3-vl:2b
   * @param {string} prompt 
   * @param {string} imageBase64 - Base64 encoded image
   * @param {Object} options 
   * @returns {Promise<string>}
   */
  async vision(prompt, imageBase64, options = {}) {
    const requestBody = {
      model: this.config.model,
      prompt,
      images: [imageBase64],
      stream: false,
      options: { ...this.config.defaultOptions, ...options }
    };

    try {
      const response = await this.client.post('/api/generate', requestBody);
      return response.data.response;
    } catch (error) {
      console.error('Vision task failed:', error.message);
      throw error;
    }
  }

  /**
   * Pull a model from Ollama library
   * @param {string} modelName 
   * @returns {Promise<void>}
   */
  async pullModel(modelName = this.config.model) {
    try {
      const response = await this.client.post('/api/pull', {
        name: modelName,
        stream: false
      });
      return response.data;
    } catch (error) {
      console.error('Failed to pull model:', error.message);
      throw error;
    }
  }
}

// Export singleton instance
export const ollamaService = new OllamaService();

export default OllamaService;
