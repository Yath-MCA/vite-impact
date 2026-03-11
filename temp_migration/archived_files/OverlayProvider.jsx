import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useModuleRegistry, OVERLAY_TYPES } from '../modules/ModuleRegistry';

const OverlayContext = createContext();

export function OverlayProvider({ children }) {
  const [overlays, setOverlays] = useState(new Map());
  const [minimizedOverlays, setMinimizedOverlays] = useState(new Map());
  const zIndexRef = useRef(1000);
  const overlayIdRef = useRef(0);

  const getNextZIndex = useCallback(() => {
    return ++zIndexRef.current;
  }, []);

  const createOverlay = useCallback((config) => {
    const id = `overlay-${++overlayIdRef.current}`;
    const zIndex = getNextZIndex();

    return {
      id,
      zIndex,
      type: config.type || OVERLAY_TYPES.DIALOG,
      dropOver: config.dropOver ?? true,
      footerType: config.footerType || 'none',
      title: config.title || 'Untitled',
      component: config.component,
      props: config.props || {},
      isMinimized: false,
      isFullscreen: false,
      position: config.position || { x: 100, y: 100 },
      size: {
        width: config.width || 600,
        height: config.height || 400
      },
      originalSize: null,
      originalPosition: null,
      moduleName: config.moduleName,
      onClose: config.onClose,
      onAction: config.onAction,
      actionConfig: config.actionConfig
    };
  }, [getNextZIndex]);

  const openOverlay = useCallback((config) => {
    const overlay = createOverlay(config);

    setOverlays(prev => {
      const next = new Map(prev);
      next.set(overlay.id, overlay);
      return next;
    });

    if (overlay.dropOver) {
      document.body.style.overflow = 'hidden';
    }

    return overlay.id;
  }, [createOverlay]);

  const openModule = useCallback((moduleName, props = {}) => {
    const { getModule } = useModuleRegistry();
    const module = getModule(moduleName);

    if (!module) {
      throw new Error(`Module "${moduleName}" is not registered`);
    }

    return openOverlay({
      type: module.defaultType,
      dropOver: module.dropOver,
      footerType: module.footerType,
      component: module.component,
      props: { ...module.defaultProps, ...props },
      width: module.width,
      height: module.height,
      moduleName,
      title: props.title || module.name
    });
  }, [openOverlay]);

  const closeOverlay = useCallback((id) => {
    const overlay = overlays.get(id);
    
    setOverlays(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });

    setMinimizedOverlays(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });

    overlay?.onClose?.();

    // Restore scroll if no dropOver overlays remain
    const hasDropOver = Array.from(overlays.values()).some(
      o => o.id !== id && o.dropOver && !o.isMinimized
    );
    if (!hasDropOver) {
      document.body.style.overflow = '';
    }
  }, [overlays]);

  const minimizeOverlay = useCallback((id) => {
    setOverlays(prev => {
      const next = new Map(prev);
      const overlay = next.get(id);
      if (overlay) {
        next.set(id, { ...overlay, isMinimized: true });
      }
      return next;
    });

    setMinimizedOverlays(prev => {
      const next = new Map(prev);
      const overlay = overlays.get(id);
      if (overlay) {
        next.set(id, { ...overlay, isMinimized: true });
      }
      return next;
    });

    // Restore scroll if no dropOver overlays remain open
    const hasDropOver = Array.from(overlays.values()).some(
      o => o.id !== id && o.dropOver && !o.isMinimized
    );
    if (!hasDropOver) {
      document.body.style.overflow = '';
    }
  }, [overlays]);

  const restoreOverlay = useCallback((id) => {
    setOverlays(prev => {
      const next = new Map(prev);
      const overlay = next.get(id);
      if (overlay) {
        const zIndex = getNextZIndex();
        next.set(id, { ...overlay, isMinimized: false, zIndex });
      }
      return next;
    });

    setMinimizedOverlays(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });

    // Lock scroll if it's a dropOver overlay
    const overlay = overlays.get(id);
    if (overlay?.dropOver) {
      document.body.style.overflow = 'hidden';
    }
  }, [overlays, getNextZIndex]);

  const toggleFullscreen = useCallback((id) => {
    setOverlays(prev => {
      const next = new Map(prev);
      const overlay = next.get(id);
      
      if (overlay) {
        if (!overlay.isFullscreen) {
          // Enter fullscreen
          next.set(id, {
            ...overlay,
            isFullscreen: true,
            originalSize: overlay.size,
            originalPosition: overlay.position
          });
        } else {
          // Exit fullscreen
          next.set(id, {
            ...overlay,
            isFullscreen: false,
            size: overlay.originalSize || overlay.size,
            position: overlay.originalPosition || overlay.position
          });
        }
      }
      return next;
    });
  }, []);

  const switchOverlayType = useCallback((id, newType) => {
    setOverlays(prev => {
      const next = new Map(prev);
      const overlay = next.get(id);
      
      if (overlay && overlay.type !== newType) {
        next.set(id, {
          ...overlay,
          type: newType,
          // Reset position when switching to dialog/sidebar
          position: newType === OVERLAY_TYPES.POPOUT 
            ? overlay.position 
            : { x: 0, y: 0 },
          // Reset size for sidebar
          size: newType === OVERLAY_TYPES.SIDEBAR
            ? { width: 400, height: '100vh' }
            : overlay.size
        });
      }
      return next;
    });
  }, []);

  const focusOverlay = useCallback((id) => {
    setOverlays(prev => {
      const next = new Map(prev);
      const overlay = next.get(id);
      
      if (overlay && !overlay.isMinimized) {
        next.set(id, { ...overlay, zIndex: getNextZIndex() });
      }
      return next;
    });
  }, [getNextZIndex]);

  const updateOverlayPosition = useCallback((id, position) => {
    setOverlays(prev => {
      const next = new Map(prev);
      const overlay = next.get(id);
      
      if (overlay) {
        next.set(id, { ...overlay, position });
      }
      return next;
    });
  }, []);

  const updateOverlaySize = useCallback((id, size) => {
    setOverlays(prev => {
      const next = new Map(prev);
      const overlay = next.get(id);
      
      if (overlay && !overlay.isFullscreen) {
        next.set(id, { ...overlay, size });
      }
      return next;
    });
  }, []);

  const getTopOverlay = useCallback(() => {
    const openOverlays = Array.from(overlays.values())
      .filter(o => !o.isMinimized)
      .sort((a, b) => b.zIndex - a.zIndex);
    return openOverlays[0];
  }, [overlays]);

  // Handle ESC key to close top dropOver overlay
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        const top = getTopOverlay();
        if (top && top.dropOver) {
          closeOverlay(top.id);
        }
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [closeOverlay, getTopOverlay]);

  const value = {
    overlays,
    minimizedOverlays,
    openOverlay,
    openModule,
    closeOverlay,
    minimizeOverlay,
    restoreOverlay,
    toggleFullscreen,
    switchOverlayType,
    focusOverlay,
    updateOverlayPosition,
    updateOverlaySize,
    getTopOverlay,
    OVERLAY_TYPES
  };

  return (
    <OverlayContext.Provider value={value}>
      {children}
    </OverlayContext.Provider>
  );
}

export const useOverlay = () => {
  const context = useContext(OverlayContext);
  if (!context) {
    throw new Error('useOverlay must be used within OverlayProvider');
  }
  return context;
};
