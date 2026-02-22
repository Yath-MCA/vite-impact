import React, { useEffect, useState, useRef } from 'react';
import InitialLoadDialog from './InitialLoadDialog';

/**
 * AppInitializer Component
 * Main orchestration component that initializes all services
 * and renders the loading dialog
 * 
 * @param {Object} props
 * @param {Function} props.onInitialized - Callback when initialization completes
 * @param {Function} props.onError - Callback on initialization error
 * @param {boolean} props.autoStart - Whether to auto-start initialization (default true)
 */
const AppInitializer = ({ onInitialized, onError, autoStart = true }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const servicesRef = useRef(null);
  const initAttempted = useRef(false);

  // Initialize services
  useEffect(() => {
    if (initAttempted.current) return;
    initAttempted.current = true;

    // Wait for DOM and legacy scripts
    const init = () => {
      try {
        // Services should be available on window from services bundle
        if (!window.InitService || !window.LoadingService || !window.EditorInitService) {
          console.error('Services not loaded');
          setError('Services not available');
          return;
        }

        // Create service instances
        const urlService = new window.URLService();
        const storageService = new window.StorageService();
        const sharedKeyService = new window.SharedKeyService(storageService);
        const initService = new window.InitService(urlService, storageService, sharedKeyService);
        const loadingService = new window.LoadingService(initService);
        const editorInitService = new window.EditorInitService(loadingService, sharedKeyService);

        servicesRef.current = {
          urlService,
          storageService,
          sharedKeyService,
          initService,
          loadingService,
          editorInitService
        };

        // Expose to window for legacy compatibility
        window.INIT_CONFIG = initService;
        window.LOADING_CONFIG = loadingService;
        window.EDITOR_INITIALIZE = editorInitService;

        if (autoStart) {
          startInitialization();
        }
      } catch (err) {
        console.error('Service initialization error:', err);
        setError(err.message);
        if (typeof onError === 'function') {
          onError(err);
        }
      }
    };

    // Check if DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }

    return () => {
      // Cleanup
      if (servicesRef.current) {
        const { editorInitService } = servicesRef.current;
        if (editorInitService) {
          editorInitService.clearWatchers();
        }
      }
    };
  }, [autoStart, onError]);

  // Subscribe to events
  useEffect(() => {
    if (!window.eventBus) return;

    const unsubscribers = [];

    // Track progress
    unsubscribers.push(
      window.eventBus.on('loading:progress', (data) => {
        setProgress(data.value);
      })
    );

    // Track completion
    unsubscribers.push(
      window.eventBus.on('editor:ready', () => {
        setIsInitialized(true);
        setIsLoading(false);
        if (typeof onInitialized === 'function') {
          onInitialized(servicesRef.current);
        }
      })
    );

    // Track errors
    unsubscribers.push(
      window.eventBus.on('init:failed', (data) => {
        setError(data.reason || 'Initialization failed');
        setIsLoading(false);
        if (typeof onError === 'function') {
          onError(data);
        }
      })
    );

    unsubscribers.push(
      window.eventBus.on('editor:timeout', () => {
        setError('Initialization timeout');
        if (typeof onError === 'function') {
          onError({ reason: 'timeout' });
        }
      })
    );

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [onInitialized, onError]);

  // Start initialization
  const startInitialization = () => {
    if (!servicesRef.current) return;

    const { initService, loadingService, editorInitService } = servicesRef.current;

    // Run init service
    const success = initService.run();

    if (success) {
      // Check if admin flow
      const isAdmin = initService.isUserAdmin();
      const isLocalHost = initService.isLocalHost();
      
      if (isAdmin || isLocalHost) {
        // Admin flow - skip normal initialization
        setIsInitialized(true);
        setIsLoading(false);
        if (typeof onInitialized === 'function') {
          onInitialized(servicesRef.current);
        }
        return;
      }

      // Get shared key and start loading
      const sharedKey = initService.sharedKeyService.getCurrent();
      if (sharedKey) {
        loadingService.init(sharedKey);
        
        // Start editor initialization
        editorInitService.start(sharedKey);
      } else {
        // Wait for shared key
        const docId = initService.getDocId();
        initService.sharedKeyService.startWatching(
          docId,
          (resolvedSharedKey) => {
            loadingService.init(resolvedSharedKey);
            editorInitService.start(resolvedSharedKey);
          },
          () => {
            setError('Shared key resolution timeout');
            if (typeof onError === 'function') {
              onError({ reason: 'sharedKeyTimeout' });
            }
          },
          25000
        );
      }
    }
  };

  // Manual initialization trigger
  const handleInitialize = () => {
    startInitialization();
  };

  // Handle dialog completion
  const handleDialogComplete = () => {
    setIsLoading(false);
  };

  if (error) {
    return (
      <div className="initialization-error" style={{ padding: '20px', color: 'red' }}>
        <h3>Initialization Error</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Reload Page</button>
      </div>
    );
  }

  return (
    <>
      <InitialLoadDialog
        isOpen={isLoading}
        progress={progress}
        isComplete={isInitialized}
        onComplete={handleDialogComplete}
        initService={servicesRef.current?.initService}
        loadingService={servicesRef.current?.loadingService}
        editorInitService={servicesRef.current?.editorInitService}
      />
      {!autoStart && !isInitialized && (
        <button onClick={handleInitialize}>Start Initialization</button>
      )}
    </>
  );
};

export default AppInitializer;
