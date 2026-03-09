import { useEffect, useState, useCallback, useRef } from 'react';
import { CKEditor } from 'ckeditor4-react';
import { useEditor, VIEW_MODES } from '../context/EditorContext';
import { useLayout } from '../context/LayoutContext';
import { useModule, MODULE_TYPES } from '../context/ModuleContext';
import TocPanel from '../components/editor/TocPanel';
import ThumbnailPanel from '../components/editor/ThumbnailPanel';
import PdfPreview from '../components/editor/PdfPreview';
import ModuleManager from '../modules/ModuleManager';
import EditorHeader from '../components/layout/EditorHeader';
import Footer from '../components/layout/Footer';
import { Image as ImageIcon } from 'lucide-react';

// Sample modules for demonstration
const SettingsModule = ({ onClose }) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Font Size
      </label>
      <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
        <option>Small</option>
        <option selected>Normal</option>
        <option>Large</option>
        <option>Extra Large</option>
      </select>
    </div>
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Line Spacing
      </label>
      <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
        <option>1.0</option>
        <option selected>1.5</option>
        <option>2.0</option>
      </select>
    </div>
  </div>
);

const StylesModule = ({ onClose }) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Document Style
      </label>
      <div className="grid grid-cols-2 gap-2">
        {['Modern', 'Classic', 'Minimal', 'Professional'].map((style) => (
          <button
            key={style}
            className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 dark:hover:border-primary-400 transition-colors text-sm text-gray-700 dark:text-gray-300"
          >
            {style}
          </button>
        ))}
      </div>
    </div>
  </div>
);

const MediaModule = ({ onClose }) => (
  <div className="space-y-4">
    <button className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 dark:hover:border-primary-400 transition-colors">
      <ImageIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
      <p className="text-sm text-gray-600 dark:text-gray-400">Click to upload image</p>
    </button>
  </div>
);

export default function EditorPage() {
  const { content, viewMode, setViewMode, updateContent, editorRef } = useEditor();
  const { toggles, toggle } = useLayout();
  const { registerModule, openModule } = useModule();

  const [editorData, setEditorData] = useState(`
    <h1>Document Title</h1>
    <p>This is the introduction section of your document.</p>
    <h2>Section 1: Overview</h2>
    <p>Content for section 1 goes here. You can add detailed information about this section.</p>
    <h3>Subsection 1.1</h3>
    <p>More detailed content can be added in subsections.</p>
    <h2>Section 2: Details</h2>
    <p>This section contains additional details and information.</p>
    <h3>Subsection 2.1</h3>
    <p>Supporting content for section 2.</p>
    <h2>Conclusion</h2>
    <p>Wrap up your document with a strong conclusion.</p>
  `);

  // Register modules
  useEffect(() => {
    registerModule('settings', SettingsModule, MODULE_TYPES.RIGHT_SIDEBAR, { title: 'Editor Settings' });
    registerModule('styles', StylesModule, MODULE_TYPES.MODAL, { title: 'Document Styles' });
    registerModule('media', MediaModule, MODULE_TYPES.MODAL, { title: 'Insert Media' });
    
    return () => {
      // Cleanup would go here if needed
    };
  }, [registerModule]);

  const handleEditorChange = useCallback((evt) => {
    const data = evt.editor.getData();
    setEditorData(data);
    updateContent(data);
  }, [updateContent]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <EditorHeader editorData={editorData} />

      {/* Editor Layout */}
      <main className={`flex-1 flex overflow-hidden ${toggles.editorFullscreen ? 'fixed inset-0 z-50' : ''}`}>
        {/* TOC Panel */}
        {toggles.showToc && <TocPanel />}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Editor or PDF View */}
          <div className="flex-1 overflow-hidden">
            {(viewMode === VIEW_MODES.EDITOR || viewMode === VIEW_MODES.SPLIT) && (
              <div className={`h-full ${viewMode === VIEW_MODES.SPLIT ? 'h-1/2' : 'h-full'}`}>
                <div className="h-full p-4 overflow-y-auto">
                  <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 min-h-[800px]">
                    <CKEditor
                      initData={editorData}
                      onChange={handleEditorChange}
                      config={{
                        toolbar: [
                          { name: 'document', items: ['Source', '-', 'Save', 'NewPage', 'Preview', 'Print', '-', 'Templates'] },
                          { name: 'clipboard', items: ['Cut', 'Copy', 'Paste', 'PasteText', 'PasteFromWord', '-', 'Undo', 'Redo'] },
                          { name: 'editing', items: ['Find', 'Replace', '-', 'SelectAll', '-', 'Scayt'] },
                          '/',
                          { name: 'basicstyles', items: ['Bold', 'Italic', 'Underline', 'Strike', 'Subscript', 'Superscript', '-', 'CopyFormatting', 'RemoveFormat'] },
                          { name: 'paragraph', items: ['NumberedList', 'BulletedList', '-', 'Outdent', 'Indent', '-', 'Blockquote', 'CreateDiv', '-', 'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock', '-', 'BidiLtr', 'BidiRtl', 'Language'] },
                          { name: 'links', items: ['Link', 'Unlink', 'Anchor'] },
                          { name: 'insert', items: ['Image', 'Flash', 'Table', 'HorizontalRule', 'Smiley', 'SpecialChar', 'PageBreak', 'Iframe'] },
                          '/',
                          { name: 'styles', items: ['Styles', 'Format', 'Font', 'FontSize'] },
                          { name: 'colors', items: ['TextColor', 'BGColor'] },
                          { name: 'tools', items: ['Maximize', 'ShowBlocks'] }
                        ],
                        height: 600,
                        uiColor: '#f0f0f0',
                        removePlugins: 'elementspath',
                        resize_enabled: false
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {(viewMode === VIEW_MODES.PDF || viewMode === VIEW_MODES.SPLIT) && (
              <div className={`${viewMode === VIEW_MODES.SPLIT ? 'h-1/2 border-t border-gray-200 dark:border-gray-700' : 'h-full'}`}>
                <PdfPreview />
              </div>
            )}
          </div>
        </div>

        {/* Thumbnail Panel */}
        {toggles.showThumbnails && <ThumbnailPanel />}
      </main>

      {/* Module Manager */}
      <ModuleManager />

      {!toggles.editorFullscreen && <Footer />}
    </div>
  );
}
