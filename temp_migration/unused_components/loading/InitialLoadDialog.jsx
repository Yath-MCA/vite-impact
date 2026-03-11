import React, { useEffect, useState, useCallback } from 'react';
import ProgressCircle from './ProgressCircle';
import './ProgressCircle.css';

const InitialLoadDialog = ({
  isOpen = true,
  progress = 0,
  isComplete = false,
  onComplete,
  initService,
  loadingService,
  editorInitService
}) => {
  const [currentProgress, setCurrentProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Initializing...');
  const [isVisible, setIsVisible] = useState(isOpen);
  const [isFullyLoaded, setIsFullyLoaded] = useState(false);

  const statusMessages = {
    0: 'Initializing...',
    1: 'Loading Configuration...',
    2: 'Fetching Metadata...',
    3: 'Parsing Configuration...',
    4: 'Loading Page Config...',
    5: 'Setting Profile...',
    6: 'Loading Language Pack...',
    7: 'Loading Style Settings...',
    8: 'Initializing Page...',
    9: 'Finalizing...',
    10: 'Ready'
  };

  useEffect(() => {
    if (!window.eventBus) return;

    const unsubscribers = [];

    unsubscribers.push(
      window.eventBus.on('init:complete', (data) => {
        setStatusMessage('Configuration loaded');
        setCurrentProgress(2);
      })
    );

    unsubscribers.push(
      window.eventBus.on('init:waiting', (data) => {
        if (data.for === 'sharedKey') {
          setStatusMessage('Waiting for shared key...');
        }
      })
    );

    unsubscribers.push(
      window.eventBus.on('loading:progress', (data) => {
        setCurrentProgress(data.value);
        if (data.message) {
          setStatusMessage(data.message);
        } else if (statusMessages[data.value]) {
          setStatusMessage(statusMessages[data.value]);
        }
      })
    );

    unsubscribers.push(
      window.eventBus.on('loading:complete', () => {
        setCurrentProgress(10);
        setStatusMessage('Ready');
        setIsFullyLoaded(true);
      })
    );

    unsubscribers.push(
      window.eventBus.on('editor:ready', () => {
        handleComplete();
      })
    );

    unsubscribers.push(
      window.eventBus.on('loading:error', (data) => {
        console.error('Loading error:', data);
        setStatusMessage('Error loading configuration');
      })
    );

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);

  const handleComplete = useCallback(() => {
    setIsVisible(false);
    if (typeof onComplete === 'function') {
      onComplete();
    }

    if (typeof window !== 'undefined') {
      if (window.InitialLoadDialog) {
        window.InitialLoadDialog.FullyLoaded = true;
      }

      if (!window.IS_TRACK_VIEW) {
        if (typeof window.new_session_check === 'function') {
          window.new_session_check();
        }

        if (typeof window.CAN_INITIATE_MODULE !== 'undefined' && window.CAN_INITIATE_MODULE) {
          if (typeof window.CHECK_REQUEST !== 'undefined' && window.CHECK_REQUEST.Init) {
            window.CHECK_REQUEST.Init();
          }
          if (typeof window.LOG_OUT !== 'undefined' && window.LOG_OUT.Init) {
            window.LOG_OUT.Init();
          }
        }
      }
    }
  }, [onComplete]);

  useEffect(() => {
    if ((currentProgress >= 10 && isFullyLoaded) || isComplete) {
      handleComplete();
    }
  }, [currentProgress, isFullyLoaded, isComplete, handleComplete]);

  useEffect(() => {
    if (progress !== currentProgress && progress > 0) {
      setCurrentProgress(progress);
      if (statusMessages[progress]) {
        setStatusMessage(statusMessages[progress]);
      }
    }
  }, [progress]);

  useEffect(() => {
    setIsVisible(isOpen);
  }, [isOpen]);

  const updateProgress = useCallback((value) => {
    if (value >= 0 && value <= 10) {
      setCurrentProgress(value);
      if (statusMessages[value]) {
        setStatusMessage(statusMessages[value]);
      }

      if (window.eventBus) {
        window.eventBus.emit('dialog:progress', { value });
      }
    }
  }, []);

  useEffect(() => {
    if (window.InitialLoadDialog) {
      window.InitialLoadDialog.updateProgress = updateProgress;
    }
  }, [updateProgress]);

  if (!isVisible) {
    return null;
  }

  return (
    <>
      <div className="blur-overlay" id="pageBlurOverlay" />
      <div className="loading-dialog" id="loadingDialog">
        <ProgressCircle
          value={currentProgress}
          max={10}
          status={statusMessage}
        />
      </div>
    </>
  );
};

export default InitialLoadDialog;
