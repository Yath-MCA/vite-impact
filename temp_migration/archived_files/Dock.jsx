import { useOverlay } from './OverlayProvider';
import { Maximize2 } from 'lucide-react';

export default function Dock() {
  const { minimizedOverlays, restoreOverlay } = useOverlay();

  if (minimizedOverlays.size === 0) return null;

  return (
    <div 
      data-testid="dock-container"
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2"
    >
      {Array.from(minimizedOverlays.values()).map((overlay) => (
        <button
          key={overlay.id}
          data-testid="dock-item"
          data-overlay-id={overlay.id}
          onClick={() => restoreOverlay(overlay.id)}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all group"
        >
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[150px] truncate">
            {overlay.title}
          </span>
          <Maximize2 className="w-4 h-4 text-gray-400 group-hover:text-primary-600 transition-colors" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
