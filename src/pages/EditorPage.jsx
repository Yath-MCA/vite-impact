import { useEffect, useState, useCallback, useRef } from 'react';
import { CKEditor } from 'ckeditor4-react';
import { useEditor, VIEW_MODES } from '../context/EditorContext';
import { useLayout } from '../context/LayoutContext';
import { useModule, MODULE_TYPES } from '../context/ModuleContext';
import TocPanel from '../components/editor/TocPanel';
import ThumbnailPanel from '../components/editor/ThumbnailPanel';
import EditorSection from '../components/editor/EditorSection';
import PdfSection from '../components/editor/PdfSection';
import EditorHeader from '../components/editor/EditorHeader';
import EditorFooter from '../components/editor/EditorFooter';
import ModuleManager from '../modules/ModuleManager';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { 
  LayoutTemplate, 
  FileText, 
  Columns, 
  Maximize2, 
  Minimize2,
  Settings,
  Palette,
  Type,
  Image as ImageIcon
} from 'lucide-react';

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
  const {
    content,
    viewMode,
    setViewMode,
    updateContent,
    editorRef,
    setActiveHeading,
    isDirty,
    setIsDirty
  } = useEditor();
  const { toggles, toggle } = useLayout();
  const { registerModule, openModule } = useModule();

  const [editorData, setEditorData] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const debugIgnoreContent = false; // Set to true to bypass content setting for layout testing

  const loadRandomContent = useCallback(async () => {
    if (debugIgnoreContent) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const allFiles = [
        ...Object.values(journalHtmlFiles),
        ...Object.values(bookHtmlFiles),
        ...Object.values(jsonDataFiles)
      ];
      const randomUrl = allFiles[Math.floor(Math.random() * allFiles.length)];

      if (randomUrl) {
        const response = await fetch(randomUrl);
        let html = '';

        if (randomUrl.endsWith('.json')) {
          const json = await response.json();
          html = json.content || '';
        } else {
          html = await response.text();
        }

        setEditorData(html);
        updateContent(html);

        // Update CKEditor instance if it exists
        if (editorRef.current?.editor) {
          editorRef.current.editor.setData(html);
        }
      }
    } catch (error) {
      console.error('Error loading random content:', error);
    } finally {
      setIsLoading(false);
      setIsDirty(false);
    }
  }, [updateContent, editorRef, setIsDirty]);

  // Load initial content
  useEffect(() => {
    loadRandomContent();
  }, []); // Only once on mount

  // Warn before leaving if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleSave = () => {
    if (window.confirm('Are you sure you want to save your changes and proceed?')) {
      console.log('Saving document...', editorData);
      setIsDirty(false);
      alert('Document saved successfully!');
    }
  };

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

  const viewModeButtons = [
    { mode: VIEW_MODES.EDITOR, icon: FileText, label: 'Editor' },
    { mode: VIEW_MODES.PDF, icon: LayoutTemplate, label: 'Preview' },
    { mode: VIEW_MODES.SPLIT, icon: Columns, label: 'Split' }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header />
      
      {/* Editor Toolbar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Left: View Mode Toggle */}
          <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {viewModeButtons.map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === mode
                    ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Center: Document Info */}
          <div className="hidden md:flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <span>Words: {editorData.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w.length > 0).length}</span>
            <span>Characters: {editorData.replace(/<[^>]*>/g, '').length}</span>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => openModule('styles')}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Document Styles"
            >
              <Palette className="w-5 h-5" />
            </button>
            <button
              onClick={() => openModule('media')}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Insert Media"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => openModule('settings')}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />
            <button
              onClick={() => toggle('editorFullscreen')}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Toggle Fullscreen"
            >
              {toggles.editorFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

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
      </main>

      {/* Module Manager */}
      <ModuleManager />

      {!toggles.editorFullscreen && <EditorFooter />}
    </div>
  );
}
