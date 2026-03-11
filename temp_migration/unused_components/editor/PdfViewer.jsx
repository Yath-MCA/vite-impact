import { memo, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Image as ImageIcon } from 'lucide-react';

function PdfViewer({ html, totalPages = 8 }) {
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(100);

  const scaleStyle = useMemo(
    () => ({ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }),
    [zoom]
  );

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden border-l border-gray-200 bg-white">
      <header className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-3 py-2">
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            className="rounded-md p-1.5 text-gray-600 transition-colors hover:bg-gray-200"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            aria-label="Previous page"
            title="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-medium text-gray-600">
            Page {page} / {totalPages}
          </span>
          <button
            type="button"
            className="rounded-md p-1.5 text-gray-600 transition-colors hover:bg-gray-200"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            aria-label="Next page"
            title="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            className="rounded-md p-1.5 text-gray-600 transition-colors hover:bg-gray-200"
            onClick={() => setZoom((prev) => Math.max(50, prev - 10))}
            aria-label="Zoom out"
            title="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="min-w-[3rem] text-center text-xs font-medium text-gray-600">{zoom}%</span>
          <button
            type="button"
            className="rounded-md p-1.5 text-gray-600 transition-colors hover:bg-gray-200"
            onClick={() => setZoom((prev) => Math.min(200, prev + 10))}
            aria-label="Zoom in"
            title="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-auto bg-[#f1ede5] p-4">
        <div className="mx-auto w-fit" style={scaleStyle}>
          <div className="min-h-[70vh] w-[210mm] border border-gray-300 bg-white p-8 shadow-lg">
            <div className="mb-3 flex items-center justify-between border-b border-gray-200 pb-2 text-xs text-gray-500">
              <span>PDF Proof Output</span>
              <span>Page {page}</span>
            </div>
            <div
              className="prose max-w-none text-sm"
              dangerouslySetInnerHTML={{ __html: html || '<p>Preview generated content here.</p>' }}
            />
            <div className="mt-6 rounded-md border border-dashed border-gray-300 bg-gray-50 p-3 text-xs text-gray-500">
              <div className="mb-1 inline-flex items-center gap-1 font-medium text-gray-600">
                <ImageIcon className="h-3.5 w-3.5" />
                PNG Rendering
              </div>
              <p>PNG page snapshot support placeholder for downstream PDF rasterization pipeline.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default memo(PdfViewer);
