import { createContext, useContext, useState, useEffect } from 'react';

const LayoutContext = createContext();

export function LayoutProvider({ children }) {
  const [toggles, setToggles] = useState(() => {
    const saved = localStorage.getItem('layoutToggles');
    return saved ? JSON.parse(saved) : {
      showToc: true,
      showThumbnails: true,
      showHeader: true,
      showFooter: true,
      sidebarCollapsed: false,
      editorFullscreen: false
    };
  });

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'system';
  });

  useEffect(() => {
    localStorage.setItem('layoutToggles', JSON.stringify(toggles));
  }, [toggles]);

  useEffect(() => {
    localStorage.setItem('theme', theme);

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [theme]);

  const toggle = (key) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const setToggle = (key, value) => {
    setToggles(prev => ({ ...prev, [key]: value }));
  };

  const value = {
    toggles,
    toggle,
    setToggle,
    theme,
    setTheme
  };

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
}

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within LayoutProvider');
  }
  return context;
};
