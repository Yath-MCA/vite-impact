import { memo, useMemo } from 'react';
import { useEditor } from '../../../context/EditorContext';
import { useLayout } from '../../../context/LayoutContext';
import { Image as ImageIcon, X } from 'lucide-react';

function ThumbnailPanel({ pages, onPageSelect }) {
  const { thumbnails, scrollToSegment, activeSegment, activePage, setActivePage, proofPreview } = useEditor();
  const { toggle } = useLayout();
  const adapter = proofPreview.adapter;

  const pageItems = useMemo(() => pages || thumbnails, [pages, thumbnails]);

  return (
    <aside className="flex h-full flex-col bg-white text-gray-800 [color-scheme:light]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50/80 px-3 py-2">
        <div className="flex items-center space-x-2">
          <ImageIcon className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Pages</span>
        </div>
        <button
          onClick={() => toggle('showThumbnails')}
          className="rounded p-1 transition-colors hover:bg-gray-200"
          aria-label="Close thumbnails"
        >
          <X className="w-3 h-3 text-gray-400" />
        </button>
      </div>

      {/* Thumbnails */}
      <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
        <div className="space-y-3">
          {pageItems.map((thumbnail, index) => {
            const imageSrc = adapter?.getThumbnailSource(thumbnail);
            const isActive = thumbnail.pageNumber
              ? activePage === thumbnail.pageNumber
              : activeSegment === thumbnail.segment;

            return (
            <button
              key={thumbnail.id || index}
              onClick={() => {
                if (onPageSelect) {
                  onPageSelect(thumbnail, index);
                  return;
                }

                if (thumbnail.pageNumber) {
                  setActivePage(thumbnail.pageNumber, { syncEditor: true });
                  return;
                }

                if (thumbnail.segment) {
                  scrollToSegment(thumbnail.segment);
                }
              }}
              className="w-full text-left transition-transform active:scale-95"
            >
              <div className={`relative overflow-hidden rounded-md border bg-white transition-all duration-200 ${isActive
                ? 'border-primary-500 shadow-md ring-1 ring-primary-500/20'
                : 'border-gray-200 hover:border-gray-300'
                }`}>
                {/* Compact Page Preview */}
                <div className="aspect-[3/4] bg-gray-50 p-1.5">
                  <div className="h-full rounded-sm bg-white p-1 shadow-sm">
                    {imageSrc ? (
                      <img
                        src={imageSrc}
                        alt={`${thumbnail.label || `Page ${index + 1}`} thumbnail`}
                        className="h-full w-full object-contain"
                        loading="lazy"
                        draggable="false"
                      />
                    ) : (
                      <div className="space-y-0.5 opacity-40">
                        <div className="h-1 w-3/4 rounded bg-gray-200" />
                        <div className="h-0.5 w-full rounded bg-gray-100" />
                        <div className="h-0.5 w-5/6 rounded bg-gray-100" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="absolute right-1 top-1 rounded bg-gray-900/10 px-1 py-0.5 text-[10px] font-medium text-gray-600">
                  {thumbnail.label || `Page ${index + 1}`}
                </div>
              </div>

              <p className={`mt-1 truncate px-1 text-[10px] font-medium ${isActive ? 'text-primary-600' : 'text-gray-500'}`}>
                {thumbnail.pageNumber ? `page ${thumbnail.pageNumber}` : (thumbnail.segment || `page-${index + 1}`).replace(/-/g, ' ')}
              </p>
            </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

export default memo(ThumbnailPanel);
