import { useCallback } from 'react';
import { CKEditor } from 'ckeditor4-react';
import { useEditor, VIEW_MODES } from '../../context/EditorContext';

export default function EditorSection({ editorData, setEditorData, isLoading }) {
    const {
        viewMode,
        updateContent,
        editorRef,
        setActiveHeading,
        setIsDirty
    } = useEditor();

    const handleEditorInstanceReady = useCallback((evt) => {
        const editor = evt.editor;
        editorRef.current = { editor };

        // Set initial data if available
        if (editorData) {
            // editor.setData(editorData);
        }

        // Listen to scroll events in CKEditor iframe for scroll-sync
        const win = editor.window.$;
        win.addEventListener('scroll', () => {
            const doc = editor.document.$;
            const headingElements = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
            let currentHeadingId = null;

            for (const el of headingElements) {
                const rect = el.getBoundingClientRect();
                if (rect.top >= 0 && rect.top <= 100) {
                    currentHeadingId = el.id;
                    break;
                }
            }

            if (currentHeadingId) {
                setActiveHeading(currentHeadingId);
            }
        });
    }, [editorData, editorRef, setActiveHeading]);

    const handleEditorChange = useCallback((evt) => {
        const data = evt.editor.getData();
        setEditorData(data);
        updateContent(data, true); // skipIdInjection because we are editing
        setIsDirty(true);
    }, [updateContent, setIsDirty, setEditorData]);

    if (!(viewMode === VIEW_MODES.EDITOR || viewMode === VIEW_MODES.SPLIT || viewMode === VIEW_MODES.FOUR_COLUMN)) {
        return null;
    }

    return (
        <div className={`flex-1 flex flex-col overflow-hidden bg-white dark:bg-gray-800 shadow-inner ${viewMode === VIEW_MODES.SPLIT ? 'h-1/2' : 'h-full'}`}>
            <div className="flex-1 p-6 overflow-y-auto">
                <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 min-h-[1000px] transition-shadow hover:shadow-xl">
                    <CKEditor
                        // initData={editorData}
                        onInstanceReady={handleEditorInstanceReady}
                        // onChange={handleEditorChange}
                        config={{}}
                    />
                </div>
            </div>
        </div>
    );
}
