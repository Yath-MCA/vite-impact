import { useEffect, useState, useCallback, useRef } from 'react';
import { CKEditor } from 'ckeditor4-react';
import { useEditor, VIEW_MODES } from '../context/EditorContext';
import { useLayout } from '../context/LayoutContext';
import { useModule, MODULE_TYPES } from '../context/ModuleContext';
import TocPanel from '../components/editor/TocPanel';
import ThumbnailPanel from '../components/editor/ThumbnailPanel';
import ModuleManager from '../modules/ModuleManager';
import Navbar1 from '../components/editor/Navbar1';
import Navbar2 from '../components/editor/Navbar2';
import SharedMiddleColumn from '../components/editor/SharedMiddleColumn';
import {
  Settings,
  Palette,
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
  const loadData = false; // Set to true to load content into CKEditor; false to focus on UI

  const loadRandomContent = useCallback(async () => {
    if (!loadData) {
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

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden text-gray-800" style={{ fontFamily: "'Inter', 'ui-sans-serif', system-ui" }}>
      {/* Navbar 1 & 2 */}
      <Navbar1 />
      <Navbar2 titleParent="Sample Journal" titleChild="Sample Article" hideMiddle />

      {/* Shared Middle Column for Mobile (<md) */}
      <div className="md:hidden border-b border-gray-200 bg-white px-2 py-2 flex justify-center">
        <SharedMiddleColumn />
      </div>

      {/* Editor Layout: 3 Panels */}
      <main className="flex-1 flex overflow-hidden bg-gray-100">
        {/* Left Panel: TOC */}
        {toggles.showToc && (
          <div className="w-56 border-r border-gray-200 flex-shrink-0 bg-white">
            <TocPanel />
          </div>
        )}

        {/* Center Panel: Editor Canvas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center bg-gray-100 pb-32">
          {/* Document Card */}
          <div className="w-full max-w-4xl bg-white text-gray-900 shadow-xl rounded-sm min-h-[800px] border border-gray-200 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-100 overflow-hidden relative">
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
                height: 800,
                uiColor: '#f0f0f0',
                removePlugins: 'elementspath',
                resize_enabled: false
              }}
            />
          </div>
        </div>

        {/* Right Panel: Thumbnails */}
        {toggles.showThumbnails && (
          <div className="w-[112px] border-l border-gray-200 flex-shrink-0 bg-white">
            <ThumbnailPanel />
          </div>
        )}
      </main>

      {/* Module Manager */}
      <ModuleManager />
    </div>
  );
}
