import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CKEditor } from 'ckeditor4-react';
import { Image as ImageIcon } from 'lucide-react';
import { useEditor } from '../../../context/EditorContext';
import { useLayout } from '../../../context/LayoutContext';
import { MODULE_TYPES, useModule } from '../../../context/ModuleContext';
import Navbar1 from '../components/Navbar1';
import Navbar2 from '../components/Navbar2';
import SharedMiddleColumn from '../components/SharedMiddleColumn';
import EditorFooter from '../components/EditorFooter';
import ModuleManager from '../modules/ModuleManager';
import { registerEditorAlertBridge } from '../messages/registerEditorAlertBridge.js';
import { initDownloadService } from '../../../services/download/index.js';
import { initErrorOps, errorLogTrace } from '../../../services/error/index.js';
import {
  claimValidateTab,
  releaseValidateTab,
  startTabPresenceListener,
  stopTabPresence
} from '../../../services/session/tabPresence.js';
import { SESSION_STORAGE_KEYS } from '../../../services/session/sessionConstants.js';
import { getValidateAccessKey, getValidateResponse } from '../../../services/session/sessionStorage.js';
import { normalizeSessionSource } from '../../../services/session/sessionSource.js';
import { showEditorMessage, EditorMessageKey } from '../messages/editorMessages.js';
import { loadCKEditor } from '../../../shared/utils/loadCKEditor.js';
import { useClientConfig } from '../../../services/editorConfig/useClientConfig.js';
import { useEditorContent } from '../../../services/editorConfig/useEditorContent.js';
import { Joyride } from 'react-joyride';
import { useGuidedTour } from '../tour/useGuidedTour.js';

const NavigationPanel = lazy(() => import('../components/NavigationPanel'));
const ThumbnailPanel = lazy(() => import('../components/ThumbnailPanel'));
const PdfPreview = lazy(() => import('../components/PdfPreview'));

function PanelLoader() {
  return <div className="h-full w-full animate-pulse bg-gray-100" />;
}

const SettingsModule = () => (
  <div className="space-y-4">
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">Font size</label>
      <select defaultValue="Normal" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900">
        <option>Small</option>
        <option>Normal</option>
        <option>Large</option>
      </select>
    </div>
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">Line spacing</label>
      <select defaultValue="1.5" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900">
        <option>1.0</option>
        <option>1.5</option>
        <option>2.0</option>
      </select>
    </div>
  </div>
);

const StylesModule = () => (
  <div className="grid grid-cols-2 gap-3">
    {['Modern', 'Classic', 'Minimal', 'Professional'].map((style) => (
      <button
        key={style}
        type="button"
        className="rounded-lg border border-gray-300 px-3 py-4 text-sm font-medium text-gray-700 transition-colors hover:border-orange-400 hover:text-orange-600"
      >
        {style}
      </button>
    ))}
  </div>
);

const MediaModule = () => (
  <button
    type="button"
    className="w-full rounded-xl border-2 border-dashed border-gray-300 p-6 text-center transition-colors hover:border-orange-400"
  >
    <ImageIcon className="mx-auto mb-2 h-8 w-8 text-gray-400" />
    <p className="text-sm text-gray-600">Click to upload image</p>
  </button>
);

const InspectorPopout = () => (
  <div className="space-y-3 text-sm text-gray-600">
    <p className="font-medium text-gray-800">Inspector</p>
    <p>Use this floating panel for quick checks, metadata, or in-context utilities.</p>
  </div>
);

export default function EditorPage({ readOnly = false }) {
  const {
    updateContent,
    editorRef,
    isDirty,
    setIsDirty
  } = useEditor();
  const { toggles } = useLayout();
  const { registerModule } = useModule();
  const [editorData, setEditorData] = useState('');
  const [ckeditorReady, setCkeditorReady] = useState(
    typeof window !== 'undefined' && Boolean(window.CKEDITOR)
  );
  const syncTimerRef = useRef(null);
  const sessionDocId =
    typeof sessionStorage !== 'undefined'
      ? sessionStorage.getItem(SESSION_STORAGE_KEYS.DOC_ID)
      : null;
  const validateKey =
    typeof sessionStorage !== 'undefined' ? getValidateAccessKey() : '';

  const sessionSrc = useMemo(
    () => normalizeSessionSource({}, getValidateResponse()),
    []
  );
  const isJournal = String(sessionSrc.dtd || '').toUpperCase().includes('JATS');
  const clientConfig = useClientConfig({
    client: sessionSrc.client,
    dtd: sessionSrc.dtd,
    journalCode: sessionSrc.shorttitle,
    refStyle: sessionSrc.raw?.refstyle || '',
    isJournal,
    type: sessionSrc.type
  });
  const editorContent = useEditorContent(sessionDocId);
  const isThreeColumnConfig = clientConfig.toggles.layoutMode === 'three-column';
  const guidedTour = useGuidedTour(sessionDocId);

  useEffect(() => {
    registerEditorAlertBridge();
    initDownloadService();
    initErrorOps();
  }, []);

  useEffect(() => {
    if (clientConfig.error) {
      errorLogTrace('useClientConfig', clientConfig.error.message);
    }
  }, [clientConfig.error]);

  useEffect(() => {
    let cancelled = false;
    loadCKEditor()
      .then(() => {
        if (!cancelled) setCkeditorReady(true);
      })
      .catch(() => {
        if (!cancelled) setCkeditorReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (!sessionDocId) return undefined;

    (async () => {
      const claim = await claimValidateTab({
        docId: sessionDocId,
        key: validateKey || ''
      });
      if (!active) return;
      if (!claim.ok) {
        await showEditorMessage(EditorMessageKey.LINK_OPENED);
        return;
      }
      startTabPresenceListener({
        getDocId: () => sessionDocId,
        getKey: () => validateKey || ''
      });
    })();

    return () => {
      active = false;
      releaseValidateTab({ docId: sessionDocId });
      stopTabPresence();
    };
  }, [sessionDocId, validateKey]);

  useEffect(() => {
    if (editorContent.content == null) return;
    setEditorData(editorContent.content);
    updateContent(editorContent.content);
    setIsDirty(false);
  }, [editorContent.content, setIsDirty, updateContent]);

  useEffect(() => {
    if (editorContent.content == null) return;
    guidedTour.startTour();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorContent.content]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (sessionDocId) {
        releaseValidateTab({ docId: sessionDocId });
      }
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, sessionDocId]);

  useEffect(() => {
    registerModule('settings', SettingsModule, MODULE_TYPES.RIGHT_SIDEBAR, { title: 'Editor Settings' });
    registerModule('styles', StylesModule, MODULE_TYPES.MODAL, { title: 'Document Styles' });
    registerModule('media', MediaModule, MODULE_TYPES.MODAL, { title: 'Insert Media' });
    registerModule('inspector', InspectorPopout, MODULE_TYPES.POPOUT, {
      title: 'Inspector',
      initialPosition: { x: 160, y: 160 }
    });
  }, [registerModule]);

  const handleEditorChange = useCallback((event) => {
    const nextData = event.editor.getData();
    setEditorData(nextData);
    setIsDirty(true);

    if (syncTimerRef.current) {
      window.clearTimeout(syncTimerRef.current);
    }

    syncTimerRef.current = window.setTimeout(() => {
      updateContent(nextData);
    }, 120);
  }, [setIsDirty, updateContent]);

  const handleEditorReady = useCallback(({ editor }) => {
    editorRef.current = { editor };
  }, [editorRef]);

  const handleEditorDestroyed = useCallback(() => {
    editorRef.current = null;
  }, [editorRef]);

  useEffect(() => () => {
    if (syncTimerRef.current) {
      window.clearTimeout(syncTimerRef.current);
    }
  }, []);

  const editorConfig = useMemo(() => ({
    toolbar: [
      { name: 'document', items: ['Source', '-', 'Preview', 'Print'] },
      { name: 'clipboard', items: ['Cut', 'Copy', 'Paste', '-', 'Undo', 'Redo'] },
      { name: 'basicstyles', items: ['Bold', 'Italic', 'Underline', '-', 'RemoveFormat'] },
      { name: 'paragraph', items: ['NumberedList', 'BulletedList', '-', 'Outdent', 'Indent'] },
      { name: 'links', items: ['Link', 'Unlink'] },
      { name: 'insert', items: ['Image', 'Table', 'HorizontalRule'] },
      { name: 'styles', items: ['Styles', 'Format', 'FontSize'] }
    ],
    height: 760,
    uiColor: '#f7f4ef',
    removePlugins: 'elementspath',
    resize_enabled: false
  }), []);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f5f1ea] text-gray-800" style={{ fontFamily: "'Inter', 'ui-sans-serif', system-ui" }}>
      <Navbar1 />
      <Navbar2
        titleParent={sessionDocId ? `Doc ${sessionDocId}` : 'Sample Journal'}
        titleChild={readOnly ? 'Read-only preview' : 'Sample Article'}
        hideMiddle
      />

      <div className="flex justify-center border-b border-gray-200 bg-white px-3 py-2 md:hidden">
        <SharedMiddleColumn />
      </div>

      <main className="flex min-h-0 flex-1 overflow-hidden pb-16">
        {toggles.showToc && !isThreeColumnConfig && (
          <div data-tour="toc" className="w-72 flex-shrink-0 border-r border-gray-200 bg-white">
            <Suspense fallback={<PanelLoader />}>
              <NavigationPanel />
            </Suspense>
          </div>
        )}

        <section className="flex min-w-0 flex-1 overflow-hidden">
          <div data-tour="editor-canvas" className="flex min-w-0 flex-1 justify-center overflow-y-auto bg-[#ece7de] px-3 py-4 md:px-6 md:py-6">
            <div className="w-full max-w-5xl rounded-sm border border-gray-200 bg-white shadow-[0_20px_55px_rgba(15,23,42,0.10)]">
              {editorContent.error ? (
                <div className="flex h-[760px] flex-col items-center justify-center gap-2 text-sm text-red-600">
                  <p className="font-medium">Unable to load this document.</p>
                  <p className="text-gray-500">{editorContent.error.message}</p>
                </div>
              ) : ckeditorReady && !editorContent.loading && editorContent.content != null ? (
                <CKEditor
                  initData={editorData}
                  onChange={handleEditorChange}
                  onInstanceReady={handleEditorReady}
                  onInstanceDestroyed={handleEditorDestroyed}
                  config={editorConfig}
                />
              ) : (
                <div className="flex h-[760px] items-center justify-center text-sm text-gray-500">
                  Loading document…
                </div>
              )}
            </div>
          </div>

          {!isThreeColumnConfig && (
            <div data-tour="pdf-preview" className="hidden w-[32rem] flex-shrink-0 border-l border-gray-200 bg-white xl:block">
              <Suspense fallback={<PanelLoader />}>
                <PdfPreview />
              </Suspense>
            </div>
          )}
        </section>

        {toggles.showThumbnails && !isThreeColumnConfig && (
          <div data-tour="thumbnails" className="w-[128px] flex-shrink-0 border-l border-gray-200 bg-white">
            <Suspense fallback={<PanelLoader />}>
              <ThumbnailPanel />
            </Suspense>
          </div>
        )}
      </main>

      <div data-tour="footer">
        <EditorFooter />
      </div>
      <ModuleManager />
      <Joyride
        steps={guidedTour.steps}
        run={guidedTour.run}
        stepIndex={guidedTour.stepIndex}
        onEvent={guidedTour.handleJoyrideCallback}
        continuous
        options={{ showProgress: true, buttons: ['back', 'skip', 'close', 'primary'] }}
      />
    </div>
  );
}
