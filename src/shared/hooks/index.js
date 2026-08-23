/**
 * Custom Hooks for Plugin Integration
 */

import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Hook to handle jQuery plugin cleanup
 * @param {function} initFn - Function to initialize plugin
 * @param {function} cleanupFn - Function to cleanup plugin
 * @param {Array} deps - Dependencies array
 */
export function useJQueryPlugin(initFn, cleanupFn, deps = []) {
  const isInitialized = useRef(false);
  const pluginRef = useRef(null);

  useEffect(() => {
    if (isInitialized.current) return;

    try {
      pluginRef.current = initFn();
      isInitialized.current = true;
    } catch (error) {
      console.error('[useJQueryPlugin] Initialization error:', error);
    }

    return () => {
      try {
        if (isInitialized.current && cleanupFn) {
          cleanupFn(pluginRef.current);
          isInitialized.current = false;
          pluginRef.current = null;
        }
      } catch (error) {
        console.error('[useJQueryPlugin] Cleanup error:', error);
      }
    };
  }, deps);

  return pluginRef;
}

/**
 * Hook to debounce value changes
 * @param {any} value - Value to debounce
 * @param {number} delay - Delay in ms
 * @returns {any} Debounced value
 */
export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook to handle async operations with loading state
 * @param {function} asyncFn - Async function
 * @returns {object} { execute, loading, error, data }
export function useAsync(asyncFn) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const execute = useCallback(async (...params) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await asyncFn(...params);
      setData(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [asyncFn]);

  return { execute, loading, error, data };
}

/**
 * Hook to detect clicks outside an element
 * @param {function} onOutsideClick - Callback when clicking outside
 * @returns {object} Ref to attach to element
 */
export function useClickOutside(onOutsideClick) {
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        onOutsideClick?.(event);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onOutsideClick]);

  return ref;
}

/**
 * Hook to get window size
 * @returns {object} { width, height }
 */
export function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

/**
 * Hook to manage localStorage
 * @param {string} key - Storage key
 * @param {any} initialValue - Default value
 * @returns {Array} [value, setValue, remove]
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setStoredValue = useCallback((newValue) => {
    try {
      setValue(newValue);
      window.localStorage.setItem(key, JSON.stringify(newValue));
    } catch (error) {
      console.error('[useLocalStorage] Error:', error);
    }
  }, [key]);

  const removeValue = useCallback(() => {
    try {
      setValue(initialValue);
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error('[useLocalStorage] Remove error:', error);
    }
  }, [key, initialValue]);

  return [value, setStoredValue, removeValue];
}
