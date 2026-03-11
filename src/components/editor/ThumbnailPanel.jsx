import { useEditor } from '../../context/EditorContext';
import { useLayout } from '../../context/LayoutContext';
import { Image as ImageIcon, X } from 'lucide-react';

export default function ThumbnailPanel() {
  const { thumbnails, scrollToSegment, activeSegment } = useEditor();
  const { toggle } = useLayout();

  return (
    <aside className="h-full bg-white dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
        <div className="flex items-center space-x-2">
          <ImageIcon className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Segments</span>
        </div>
        <button
          onClick={() => toggle('showThumbnails')}
          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <X className="w-3 h-3 text-gray-400" />
        </button>
      </div>

      {/* Thumbnails */}
      <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
        <div className="space-y-3">
          {thumbnails.map((thumbnail) => (
            <button
              key={thumbnail.id}
              onClick={() => scrollToSegment(thumbnail.segment)}
              className="w-full text-left transition-transform active:scale-95"
            >
              <div className={`relative bg-white dark:bg-gray-800 rounded-md border transition-all duration-200 overflow-hidden ${activeSegment === thumbnail.segment
                ? 'border-primary-500 shadow-md ring-1 ring-primary-500/20'
                : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                }`}>
                {/* Compact Page Preview */}
                <div className="aspect-[3/4] p-1.5 bg-gray-50 dark:bg-gray-800/50">
                  <div className="h-full bg-white dark:bg-gray-800 rounded-sm shadow-sm p-1">
                    <div className="space-y-0.5 opacity-40">
                      <div className="h-1 bg-gray-200 dark:bg-gray-600 rounded w-3/4" />
                      <div className="h-0.5 bg-gray-100 dark:bg-gray-700 rounded w-full" />
                      <div className="h-0.5 bg-gray-100 dark:bg-gray-700 rounded w-5/6" />
                    </div>
                  </div>
                </div>

                {/* Small Page Number Badge */}
                <div className="absolute top-1 right-1 px-1 py-0.5 bg-gray-900/10 dark:bg-white/10 text-[10px] font-medium rounded text-gray-600 dark:text-gray-400">
                  {thumbnail.label}
                </div>
              </div>

              <p className={`mt-1 text-[10px] truncate px-1 font-medium ${activeSegment === thumbnail.segment ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500'}`}>
                {thumbnail.segment.replace(/-/g, ' ')}
              </p>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
