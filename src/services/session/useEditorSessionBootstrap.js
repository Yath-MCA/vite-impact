import { useEffect, useMemo, useState } from 'react';
import { bootstrapEditorSession } from './editorSessionBootstrap.js';

export function useEditorSessionBootstrap(options = {}) {
  const stableOptions = useMemo(() => ({
    docId: options.docId || '',
    locationSearch: options.locationSearch,
    allowRecovery: options.allowRecovery !== false
  }), [options.docId, options.locationSearch, options.allowRecovery]);

  const [state, setState] = useState({
    loading: true,
    ready: false,
    error: null,
    session: null
  });

  useEffect(() => {
    let cancelled = false;
    setState({ loading: true, ready: false, error: null, session: null });

    bootstrapEditorSession(stableOptions)
      .then((result) => {
        if (cancelled) return;
        if (result.ok) {
          setState({ loading: false, ready: true, error: null, session: result });
        } else {
          setState({ loading: false, ready: false, error: result, session: null });
        }
      })
      .catch((error) => {
        if (cancelled) return;
        setState({
          loading: false,
          ready: false,
          error: {
            reason: 'bootstrap_error',
            message: error?.message || 'Unable to initialize editor session.',
            redirectTo: '/validateurl'
          },
          session: null
        });
      });

    return () => {
      cancelled = true;
    };
  }, [stableOptions]);

  return state;
}
