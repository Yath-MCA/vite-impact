import {
    useEffect,
    useRef,
    useState
} from 'react';
import axios from 'axios';
import {
    buildDocumentContentUrl
} from './editorConfigConstants.js';

/**
 * Fetches a document's editable HTML content by docId, mirroring
 * impactweb's EDITOR_INITIALIZE.RUN_READY_TO_OPEN content load. Unlike
 * useClientConfig, a failure here is blocking — EditorPage.jsx must show
 * an error state rather than silently falling back to placeholder text.
 */
export function useEditorContent(docId) {
    const [state, setState] = useState({
        content: null,
        loading: true,
        error: null
    });
    const requestIdRef = useRef(0);

    useEffect(() => {
        if (!docId) {
            setState({
                content: null,
                loading: false,
                error: {
                    message: 'Missing docId'
                }
            });
            return undefined;
        }

        const requestId = requestIdRef.current + 1;
        requestIdRef.current = requestId;
        let cancelled = false;
        setState({
            content: null,
            loading: true,
            error: null
        });
        const docUrl = buildDocumentContentUrl(docId);
        axios.get(docUrl, {
                responseType: 'text',
                validateStatus: () => true
            })
            .then((response) => {
                if (response.status < 200 || response.status >= 300) {
                    throw new Error(`Document fetch failed: ${response.status}`);
                }
                return response.data || '';
            })
            .then((html) => {
                if (cancelled || requestIdRef.current !== requestId) return;
                setState({
                    content: html,
                    loading: false,
                    error: null
                });
            })
            .catch((err) => {
                if (cancelled || requestIdRef.current !== requestId) return;
                setState({
                    content: null,
                    loading: false,
                    error: {
                        message: err.message
                    }
                });
            });

        return () => {
            cancelled = true;
        };
    }, [docId]);

    return state;
}
