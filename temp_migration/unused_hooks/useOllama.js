/**
 * React Hook for Ollama Integration
 * 
 * Provides easy access to Ollama API in React components.
 * Supports text generation, chat, and vision tasks.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { ollamaService } from './ollamaService';

/**
 * Hook for text generation
 * @param {Object} options 
 * @returns {Object}
 */
export const useOllamaGenerate = (options = {}) => {
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    checkAvailability();
  }, []);

  const checkAvailability = async () => {
    const available = await ollamaService.isAvailable();
    setIsAvailable(available);
  };

  const generate = useCallback(async (prompt, genOptions = {}) => {
    setIsLoading(true);
    setError(null);
    setResponse('');

    try {
      const result = await ollamaService.generate(prompt, { ...options, ...genOptions });
      setResponse(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  return { response, isLoading, error, isAvailable, generate };
};

/**
 * Hook for streaming text generation
 * @param {Object} options 
 * @returns {Object}
 */
export const useOllamaStream = (options = {}) => {
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortController = useRef(null);

  const generateStream = useCallback(async (prompt, genOptions = {}) => {
    setIsLoading(true);
    setError(null);
    setResponse('');

    try {
      let fullText = '';
      
      await ollamaService.generateStream(
        prompt,
        (chunk, full) => {
          fullText = full;
          setResponse(full);
        },
        { ...options, ...genOptions }
      );

      return fullText;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  const stop = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort();
    }
  }, []);

  return { response, isLoading, error, generateStream, stop };
};

/**
 * Hook for chat conversations
 * @param {Object} options 
 * @returns {Object}
 */
export const useOllamaChat = (options = {}) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = useCallback(async (content) => {
    const newMessage = { role: 'user', content };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await ollamaService.chat(updatedMessages, options);
      const assistantMessage = response.message;
      
      setMessages([...updatedMessages, assistantMessage]);
      return assistantMessage;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [messages, options]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isLoading, error, sendMessage, clearChat };
};

/**
 * Hook for vision tasks with images
 * @param {Object} options 
 * @returns {Object}
 */
export const useOllamaVision = (options = {}) => {
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyze = useCallback(async (prompt, imageBase64, visionOptions = {}) => {
    setIsLoading(true);
    setError(null);
    setResponse('');

    try {
      const result = await ollamaService.vision(
        prompt, 
        imageBase64, 
        { ...options, ...visionOptions }
      );
      setResponse(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  return { response, isLoading, error, analyze };
};

/**
 * Hook to check Ollama availability and models
 * @returns {Object}
 */
export const useOllamaStatus = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [models, setModels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setIsLoading(true);
    try {
      const available = await ollamaService.isAvailable();
      setIsAvailable(available);
      
      if (available) {
        const modelList = await ollamaService.listModels();
        setModels(modelList);
      }
    } catch (error) {
      console.error('Status check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refresh = () => checkStatus();

  return { isAvailable, models, isLoading, refresh };
};

export default {
  useOllamaGenerate,
  useOllamaStream,
  useOllamaChat,
  useOllamaVision,
  useOllamaStatus
};
