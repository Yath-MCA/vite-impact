import { useCallback, useMemo, useState } from 'react';

const INITIAL_STATE = {
  dialog: null,
  popout: null,
  sidebar: null
};

export function useOverlayManager() {
  const [state, setState] = useState(INITIAL_STATE);

  const openDialog = useCallback((payload) => {
    setState((prev) => ({ ...prev, dialog: payload }));
  }, []);

  const openPopout = useCallback((payload) => {
    setState((prev) => ({ ...prev, popout: payload }));
  }, []);

  const openSidebar = useCallback((payload) => {
    setState((prev) => ({ ...prev, sidebar: payload }));
  }, []);

  const closeDialog = useCallback(() => {
    setState((prev) => ({ ...prev, dialog: null }));
  }, []);

  const closePopout = useCallback(() => {
    setState((prev) => ({ ...prev, popout: null }));
  }, []);

  const closeSidebar = useCallback(() => {
    setState((prev) => ({ ...prev, sidebar: null }));
  }, []);

  const closeAll = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  return useMemo(() => ({
    overlays: state,
    openDialog,
    openPopout,
    openSidebar,
    closeDialog,
    closePopout,
    closeSidebar,
    closeAll
  }), [
    closeAll,
    closeDialog,
    closePopout,
    closeSidebar,
    openDialog,
    openPopout,
    openSidebar,
    state
  ]);
}
