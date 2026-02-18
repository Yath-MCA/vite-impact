import { useEditor } from '../../context/EditorContext';
import { useLayout } from '../../context/LayoutContext';
import { Image as ImageIcon, X, PanelRight } from 'lucide-react';

export default function ThumbnailPanel() {
  const { thumbnails, scrollToSegment } = useEditor();
  const { toggles, toggle } = useLayout();

  if (!toggles.showThumbnails) {
    return (
      <button
        onClick={() => toggle('showThumbnails')}
        className="fixed right-4 top-24 z-40 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        title="Show Thumbnails"
      >
        <PanelRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>
    );
  }

  return (
    <aside className="w-64 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <ImageIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <span className="font-semibold text-gray-900 dark:text-white">Preview</span>
        </div>
        <button
          onClick={() => toggle('showThumbnails')}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Thumbnails */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {thumbnails.map((thumbnail, index) => (
            <button
              key={thumbnail.id}
              onClick={() => scrollToSegment(thumbnail.segment)}
              className="w-full group"
            >
              <div className="relative bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 group-hover:border-primary-500 dark:group-hover:border-primary-400 transition-colors overflow-hidden">
                {/* Page Preview */}
                <div className="aspect-[3/4] p-3 bg-gray-50 dark:bg-gray-800">
                  <div className="h-full bg-white dark:bg-gray-700 rounded shadow-sm p-2">
                    <div className="space-y-1">
                      <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-3/4" />
                      <div className="h-1 bg-gray-100 dark:bg-gray-500 rounded w-full" />
                      <div className="h-1 bg-gray-100 dark:bg-gray-500 rounded w-5/6" />
                      <div className="h-1 bg-gray-100 dark:bg-gray-500 rounded w-4/5" />
                    </div>
                    <div className="mt-3 space-y-1">
                      <div className="h-1 bg-gray-100 dark:bg-gray-500 rounded w-full" />
                      <div className="h-1 bg-gray-100 dark:bg-gray-500 rounded w-3/4" />
                      <div className="h-1 bg-gray-100 dark:bg-gray-500 rounded w-5/6" />
                    </div>
                  </div>
                </div>
                
                {/* Page Number */}
                <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded">
                  {thumbnail.label}
                </div>
              </div>
              
              <p className="mt-2 text-xs text-center text-gray-600 dark:text-gray-400 capitalize">
                {thumbnail.segment.replace(/-/g, ' ')}
              </p>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
