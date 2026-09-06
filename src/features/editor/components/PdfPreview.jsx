import { ChevronLeft, ChevronRight, FileWarning } from 'lucide-react';
import { useEditor } from '../../../context/EditorContext';

export default function PdfPreview() {
  const { contentRef, proofPreview, proofPages, activePage, setActivePage } = useEditor();
  const adapter = proofPreview.adapter;
  const activePageItem = proofPages.find((page) => page.pageNumber === activePage) || proofPages[0];
  const activeIndex = proofPages.findIndex((page) => page.pageNumber === activePage);
  const canGoPrevious = activeIndex > 0;
  const canGoNext = activeIndex >= 0 && activeIndex < proofPages.length - 1;

  const goToOffset = (offset) => {
    if (activeIndex < 0) return;
    const nextPage = proofPages[activeIndex + offset];
    if (nextPage) setActivePage(nextPage.pageNumber, { syncEditor: true });
  };

  const pageSource = adapter?.getPageSource(activePageItem);

  return (
    <div
      ref={contentRef}
      className="flex h-full flex-col overflow-hidden bg-[#f4f2ed] text-gray-800 [color-scheme:light]"
    >
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2">
        <button
          type="button"
          onClick={() => goToOffset(-1)}
          disabled={!canGoPrevious}
          className="rounded p-1.5 text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
          aria-label="Previous proof page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-xs font-semibold uppercase text-gray-500">
          {activePageItem ? activePageItem.label : 'Proof Preview'}
        </span>
        <button
          type="button"
          onClick={() => goToOffset(1)}
          disabled={!canGoNext}
          className="rounded p-1.5 text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
          aria-label="Next proof page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-6">
        {proofPreview.loading ? (
          <div className="mx-auto aspect-[210/297] max-w-[420px] animate-pulse rounded-sm bg-white shadow" />
        ) : pageSource ? (
          <div className="mx-auto max-w-[420px] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.16)]">
            <img
              src={pageSource}
              alt={`${activePageItem.label} proof`}
              className="block h-auto w-full bg-white"
              draggable="false"
            />
          </div>
        ) : (
          <div className="mx-auto flex aspect-[210/297] max-w-[420px] flex-col items-center justify-center gap-3 rounded-sm border border-dashed border-gray-300 bg-white px-6 text-center text-sm text-gray-500">
            <FileWarning className="h-8 w-8 text-gray-400" />
            <p className="font-medium text-gray-700">Proof preview is unavailable.</p>
            <p>The editor content loaded, but no proof pages were found for this document.</p>
          </div>
        )}

        {proofPreview.error && proofPages.length > 0 && (
          <p className="mx-auto mt-3 max-w-[420px] text-xs text-amber-700">
            Proof page map was not available; showing generated page paths.
          </p>
        )}
      </div>

      {proofPages.length > 0 && (
        <div className="border-t border-gray-200 bg-white px-4 py-2 text-center text-xs text-gray-500">
          Page {activeIndex + 1 || 1} of {proofPages.length}
        </div>
      )}
    </div>
  );
}
