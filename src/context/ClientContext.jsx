import { createContext, useContext, useState, useEffect } from 'react';

const ClientContext = createContext();

export const CLIENT_CONFIGS = {
  'default-client': {
    name: 'Default Client',
    theme: 'light',
    primaryColor: '#3b82f6',
    apiBaseUrl: 'https://api.default-client.com',
    features: {
      dashboard: true,
      adminDashboard: false,
      editor: true,
      pdfExport: true,
      collaboration: false
    },
    layout: {
      showHeader: true,
      showFooter: true,
      sidebarPosition: 'left'
    }
  },
  'enterprise-client': {
    name: 'Enterprise Client',
    theme: 'dark',
    primaryColor: '#8b5cf6',
    apiBaseUrl: 'https://api.enterprise-client.com',
    features: {
      dashboard: true,
      adminDashboard: true,
      editor: true,
      pdfExport: true,
      collaboration: true,
      advancedAnalytics: true
    },
    layout: {
      showHeader: true,
      showFooter: false,
      sidebarPosition: 'right'
    }
  },
  'basic-client': {
    name: 'Basic Client',
    theme: 'light',
    primaryColor: '#10b981',
    apiBaseUrl: 'https://api.basic-client.com',
    features: {
      dashboard: true,
      adminDashboard: false,
      editor: true,
      pdfExport: false,
      collaboration: false
    },
    layout: {
      showHeader: true,
      showFooter: true,
      sidebarPosition: 'left'
    }
  }
};

export function ClientProvider({ children }) {
  const [clientConfig, setClientConfig] = useState(CLIENT_CONFIGS['default-client']);
  const [clientId, setClientId] = useState('default-client');

  const loadClientConfig = (client) => {
    const config = CLIENT_CONFIGS[client] || CLIENT_CONFIGS['default-client'];
    setClientConfig(config);
    setClientId(client);
    
    if (config.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const updateClientConfig = (updates) => {
    setClientConfig(prev => ({ ...prev, ...updates }));
  };

  useEffect(() => {
    const savedClient = localStorage.getItem('lastClient');
    if (savedClient && CLIENT_CONFIGS[savedClient]) {
      loadClientConfig(savedClient);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('lastClient', clientId);
  }, [clientId]);

  const value = {
    clientConfig,
    clientId,
    loadClientConfig,
    updateClientConfig,
    availableClients: Object.keys(CLIENT_CONFIGS)
  };

  return (
    <ClientContext.Provider value={value}>
      {children}
    </ClientContext.Provider>
  );
}

export const useClient = () => {
  const context = useContext(ClientContext);
  if (!context) {
    throw new Error('useClient must be used within ClientProvider');
  }
  return context;
};
