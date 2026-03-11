import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

const ErrorTrackerContext = createContext();

export function ErrorTrackerProvider({ children }) {
  const [errors, setErrors] = useState([]);
  const errorIdRef = useRef(0);

  const logError = useCallback((error, context = {}) => {
    const errorEntry = {
      id: ++errorIdRef.current,
      message: error.message || error,
      stack: error.stack,
      context: {
        ...context,
        timestamp: new Date().toISOString(),
        url: window.location.href
      }
    };

    setErrors(prev => [errorEntry, ...prev]);
    
    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorTracker]', errorEntry);
    }
  }, []);

  const getErrors = useCallback(() => errors, [errors]);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const removeError = useCallback((id) => {
    setErrors(prev => prev.filter(e => e.id !== id));
  }, []);

  const value = {
    errors,
    logError,
    getErrors,
    clearErrors,
    removeError,
    errorCount: errors.length
  };

  return (
    <ErrorTrackerContext.Provider value={value}>
      {children}
    </ErrorTrackerContext.Provider>
  );
}

export const useErrorTracker = () => {
  const context = useContext(ErrorTrackerContext);
  if (!context) {
    throw new Error('useErrorTracker must be used within ErrorTrackerProvider');
  }
  return context;
};
