import { createContext, useContext, useState, useCallback } from 'react';

const ModuleRegistryContext = createContext();

export const OVERLAY_TYPES = {
  DIALOG: 'dialog',
  POPOUT: 'popout',
  SIDEBAR: 'sidebar'
};

export const FOOTER_TYPES = {
  ACTIONS: 'actions',
  NONE: 'none'
};

export function ModuleRegistryProvider({ children }) {
  const [modules, setModules] = useState(new Map());

  const registerModule = useCallback((config) => {
    const {
      name,
      component,
      defaultType = OVERLAY_TYPES.DIALOG,
      dropOver = true,
      footerType = FOOTER_TYPES.NONE,
      defaultProps = {},
      width,
      height
    } = config;

    if (!name || !component) {
      throw new Error('Module registration requires name and component');
    }

    setModules(prev => {
      const next = new Map(prev);
      next.set(name, {
        name,
        component,
        defaultType,
        dropOver,
        footerType,
        defaultProps,
        width,
        height,
        registeredAt: Date.now()
      });
      return next;
    });

    return () => {
      setModules(prev => {
        const next = new Map(prev);
        next.delete(name);
        return next;
      });
    };
  }, []);

  const getModule = useCallback((name) => {
    return modules.get(name);
  }, [modules]);

  const isModuleRegistered = useCallback((name) => {
    return modules.has(name);
  }, [modules]);

  const getAllModules = useCallback(() => {
    return Array.from(modules.values());
  }, [modules]);

  const value = {
    modules,
    registerModule,
    getModule,
    isModuleRegistered,
    getAllModules,
    OVERLAY_TYPES,
    FOOTER_TYPES
  };

  return (
    <ModuleRegistryContext.Provider value={value}>
      {children}
    </ModuleRegistryContext.Provider>
  );
}

export const useModuleRegistry = () => {
  const context = useContext(ModuleRegistryContext);
  if (!context) {
    throw new Error('useModuleRegistry must be used within ModuleRegistryProvider');
  }
  return context;
};
