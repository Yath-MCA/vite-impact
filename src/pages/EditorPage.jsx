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
import {
  LayoutTemplate,
  FileText,
  Columns,
  Maximize2,
  Minimize2,
  Settings,
  Palette,
  Type,
  Save,
  Image as ImageIcon,
  RefreshCw
} from 'lucide-react';

const journalHtmlFiles = import.meta.glob('../assets/data/journal/*.html', { as: 'url', eager: true });
const bookHtmlFiles = import.meta.glob('../assets/data/book/*.html', { as: 'url', eager: true });
const jsonDataFiles = import.meta.glob('../assets/data/*.json', { as: 'url', eager: true });

// Ensure local CKEditor 4 is used instead of CDN
if (typeof window !== 'undefined') {
  CKEditor.editorUrl = '/ckeditor4/ckeditor.js';
}

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

  const viewModeButtons = [
    { mode: VIEW_MODES.EDITOR, icon: FileText, label: 'Editor' },
    { mode: VIEW_MODES.PDF, icon: LayoutTemplate, label: 'Preview' },
    { mode: VIEW_MODES.SPLIT, icon: Columns, label: 'Split' },
    { mode: VIEW_MODES.FOUR_COLUMN, icon: Maximize2, label: 'Full Layout' }
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <EditorHeader
        loadRandomContent={loadRandomContent}
        handleSave={handleSave}
        editorData={editorData}
        isLoading={isLoading}
      />

      {/* Editor Layout */}
      <main className="flex-1 flex overflow-hidden">
        {/* 1. TOC Panel (Left) */}
        <div
          className={`border-r-2 border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800 shadow-sm z-10 transition-all duration-300 ease-in-out ${toggles.showToc ? 'w-64' : 'w-12'
            }`}
        >
          {toggles.showToc ? <TocPanel /> : (
            <div className="h-full flex flex-col items-center py-4 space-y-4">
              <button
                onClick={() => toggle('showToc')}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
              >
                <Columns className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* 2 & 3. Main Content Area (Editor + PDF) */}
        <div className="flex-1 flex overflow-hidden relative bg-gray-50 dark:bg-gray-900 gap-px">
          <EditorSection
            editorData={editorData}
            setEditorData={setEditorData}
            isLoading={isLoading}
          />
          <PdfSection />
        </div>

        {/* 4. Thumbnail Panel (Right) */}
        <div
          className={`border-l-2 border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800 overflow-y-auto shadow-sm transition-all duration-300 ease-in-out ${toggles.showThumbnails ? 'w-56' : 'w-12'
            }`}
        >
          {toggles.showThumbnails ? <ThumbnailPanel /> : (
            <div className="h-full flex flex-col items-center py-4 space-y-4">
              <button
                onClick={() => toggle('showThumbnails')}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Module Manager */}
      <ModuleManager />

      {!toggles.editorFullscreen && <EditorFooter />}
    </div>
  );
}
