import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CKEditor } from 'ckeditor4-react';
import { Image as ImageIcon } from 'lucide-react';
import { useEditor } from '../context/EditorContext';
import { useLayout } from '../context/LayoutContext';
import { MODULE_TYPES, useModule } from '../context/ModuleContext';
import Navbar1 from '../components/editor/Navbar1';
import Navbar2 from '../components/editor/Navbar2';
import SharedMiddleColumn from '../components/editor/SharedMiddleColumn';
import EditorFooter from '../components/editor/EditorFooter';
import ModuleManager from '../modules/ModuleManager';

const NavigationPanel = lazy(() => import('../components/editor/NavigationPanel'));
const ThumbnailPanel = lazy(() => import('../components/editor/ThumbnailPanel'));
const PdfPreview = lazy(() => import('../components/editor/PdfPreview'));

function PanelLoader() {
  return <div className="h-full w-full animate-pulse bg-gray-100" />;
}

const INITIAL_CONTENT = `
  <article>
    <h1>CMS Editor Workspace</h1>
    <p>This starter page provides a modular editing workspace with navigation, preview, overlays, permissions, and a responsive two-tier toolbar.</p>
    <h2>Introduction</h2>
    <p>Use the left panel for structural navigation, edit content in the center canvas, and compare output in the preview panel.</p>
    <h2>Editorial Notes</h2>
    <p>Dialogs, sidebars, and popouts can be attached to workflows such as settings, queries, or media insertion.</p>
    <h2>Production Preview</h2>
    <p>The preview panel reflects content updates and keeps the editor layout aligned with production-oriented review tasks.</p>
  </article>
`;

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

export default function EditorPage() {
  const {
    updateContent,
    editorRef,
    isDirty,
    setIsDirty
  } = useEditor();
  const { toggles } = useLayout();
  const { registerModule } = useModule();
  const [editorData, setEditorData] = useState(INITIAL_CONTENT);
  const syncTimerRef = useRef(null);

  useEffect(() => {
    updateContent(INITIAL_CONTENT);
    setIsDirty(false);
  }, [setIsDirty, updateContent]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

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
      <Navbar2 titleParent="Sample Journal" titleChild="Sample Article" hideMiddle />

      <div className="flex justify-center border-b border-gray-200 bg-white px-3 py-2 md:hidden">
        <SharedMiddleColumn />
      </div>

      <main className="flex min-h-0 flex-1 overflow-hidden pb-16">
        {toggles.showToc && (
          <div className="w-72 flex-shrink-0 border-r border-gray-200 bg-white">
            <Suspense fallback={<PanelLoader />}>
              <NavigationPanel />
            </Suspense>
          </div>
        )}

        <section className="flex min-w-0 flex-1 overflow-hidden">
          <div className="flex min-w-0 flex-1 justify-center overflow-y-auto bg-[#ece7de] px-3 py-4 md:px-6 md:py-6">
            <div className="w-full max-w-5xl rounded-sm border border-gray-200 bg-white shadow-[0_20px_55px_rgba(15,23,42,0.10)]">
              <CKEditor
                ref={editorRef}
                initData={editorData}
                onChange={handleEditorChange}
                config={editorConfig}
              />
            </div>
          </div>

          <div className="hidden w-[32rem] flex-shrink-0 border-l border-gray-200 bg-white xl:block">
            <Suspense fallback={<PanelLoader />}>
              <PdfPreview />
            </Suspense>
          </div>
        </section>

        {toggles.showThumbnails && (
          <div className="w-[128px] flex-shrink-0 border-l border-gray-200 bg-white">
            <Suspense fallback={<PanelLoader />}>
              <ThumbnailPanel />
            </Suspense>
          </div>
        )}
      </main>

      <EditorFooter />
      <ModuleManager />
    </div>
  );
}
