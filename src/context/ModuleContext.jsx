import { createContext, useContext, useState, useCallback } from 'react';

const ModuleContext = createContext();

export const MODULE_TYPES = {
  MODAL: 'modal',
  RIGHT_SIDEBAR: 'right-sidebar',
  POPOUT: 'popout'
};

export function ModuleProvider({ children }) {
  const [registeredModules, setRegisteredModules] = useState(new Map());
  const [activeModules, setActiveModules] = useState(new Map());
  const [modalStack, setModalStack] = useState([]);

  const registerModule = useCallback((name, component, type = MODULE_TYPES.MODAL, props = {}) => {
    setRegisteredModules(prev => {
      const next = new Map(prev);
      next.set(name, { component, type, defaultProps: props });
      return next;
    });
  }, []);

  const unregisterModule = useCallback((name) => {
    setRegisteredModules(prev => {
      const next = new Map(prev);
      next.delete(name);
      return next;
    });
    closeModule(name);
  }, []);

  const openModule = useCallback((name, props = {}) => {
    const moduleDef = registeredModules.get(name);
    if (!moduleDef) {
      console.warn(`Module "${name}" is not registered`);
      return;
    }

    setActiveModules(prev => {
      const next = new Map(prev);
      next.set(name, { ...moduleDef, props: { ...moduleDef.defaultProps, ...props } });
      return next;
    });

    if (moduleDef.type === MODULE_TYPES.MODAL) {
      setModalStack(prev => [...prev, name]);
    }
  }, [registeredModules]);

  const closeModule = useCallback((name) => {
    setActiveModules(prev => {
      const next = new Map(prev);
      next.delete(name);
      return next;
    });

    setModalStack(prev => prev.filter(m => m !== name));
  }, []);

  const closeAllModules = useCallback(() => {
    setActiveModules(new Map());
    setModalStack([]);
  }, []);

  const isModuleOpen = useCallback((name) => {
    return activeModules.has(name);
  }, [activeModules]);

  const getActiveModulesByType = useCallback((type) => {
    return Array.from(activeModules.entries())
      .filter(([_, module]) => module.type === type)
      .map(([name, module]) => ({ name, ...module }));
  }, [activeModules]);

  const value = {
    registerModule,
    unregisterModule,
    openModule,
    closeModule,
    closeAllModules,
    isModuleOpen,
    getActiveModulesByType,
    modalStack,
    activeModals: getActiveModulesByType(MODULE_TYPES.MODAL),
    activeSidebars: getActiveModulesByType(MODULE_TYPES.RIGHT_SIDEBAR),
    activePopouts: getActiveModulesByType(MODULE_TYPES.POPOUT)
  };

  return (
    <ModuleContext.Provider value={value}>
      {children}
    </ModuleContext.Provider>
  );
}

export const useModule = () => {
  const context = useContext(ModuleContext);
  if (!context) {
    throw new Error('useModule must be used within ModuleProvider');
  }
  return context;
};
