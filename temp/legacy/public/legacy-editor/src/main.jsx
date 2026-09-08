import React from 'react';
import ReactDOM from 'react-dom/client';
import ImpactRoot from './components/loading/ImpactRoot';

// Import all services (they attach to window)
import './services/core/URLService';
import './services/core/StorageService';
import './services/core/SharedKeyService';
import './services/core/InitService';
import './services/core/LoadingService';
import './services/core/EditorInitService';
import './services/bridge/GlobalBridge';
import './events/EventEmitter';

// Import styles
import './components/loading/ProgressCircle.css';

/**
 * Initialize the application
 * This function can be called manually or auto-started
 */
function initializeApp() {
  // Wait for legacy scripts to load
  const startApp = () => {
    const container = document.getElementById('impact-root');
    
    if (!container) {
      console.warn('ImpactApp: No #impact-root container found. Creating one.');
      const rootDiv = document.createElement('div');
      rootDiv.id = 'impact-root';
      document.body.appendChild(rootDiv);
    }

    const root = ReactDOM.createRoot(document.getElementById('impact-root'));
    
    root.render(
      <React.StrictMode>
        <ImpactRoot 
          onInitialized={(services) => {
            console.log('ImpactApp: Initialization complete', services);
            
            // Dispatch custom event for legacy listeners
            if (typeof window !== 'undefined') {
              const event = document.createEvent('CustomEvent');
              event.initCustomEvent('impact:initialized', true, true, { services });
              window.dispatchEvent(event);
            }
          }}
          onError={(error) => {
            console.error('ImpactApp: Initialization error', error);
          }}
        />
      </React.StrictMode>
    );
  };

  // Check if DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
  } else {
    startApp();
  }
}

// Auto-initialize if not in module context
if (typeof window !== 'undefined') {
  window.ImpactApp = {
    initialize: initializeApp,
    version: '2.0.0',
    services: {}
  };
  
  // Auto-start
  initializeApp();
}

export default initializeApp;
