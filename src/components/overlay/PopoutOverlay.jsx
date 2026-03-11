import { useEffect, useRef, useState } from 'react';
import { Grip, X } from 'lucide-react';

export default function PopoutOverlay({ title, children, onClose, initialPosition }) {
  const [position, setPosition] = useState(initialPosition || { x: 120, y: 120 });
  const [dragging, setDragging] = useState(false);
  const dragStateRef = useRef({ offsetX: 0, offsetY: 0 });
  const popoutRef = useRef(null);

  useEffect(() => {
    const handleMove = (event) => {
      if (!dragging) return;

      setPosition({
        x: Math.max(16, event.clientX - dragStateRef.current.offsetX),
        y: Math.max(16, event.clientY - dragStateRef.current.offsetY)
      });
    };

    const handleUp = () => setDragging(false);

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);

    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [dragging]);

  return (
    <section
      ref={popoutRef}
      className="fixed z-[70] w-[min(28rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl"
      style={{ left: position.x, top: position.y }}
      aria-label={title || 'Popout overlay'}
      role="dialog"
      aria-modal="false"
    >
      <header
        className="flex cursor-move items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3"
        onPointerDown={(event) => {
          const rect = event.currentTarget.parentElement.getBoundingClientRect();
          dragStateRef.current = {
            offsetX: event.clientX - rect.left,
            offsetY: event.clientY - rect.top
          };
          setDragging(true);
        }}
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
          <Grip className="h-4 w-4 text-gray-400" />
          <span>{title || 'Popout'}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-900"
          aria-label="Close popout"
        >
          <X className="h-4 w-4" />
        </button>
      </header>
      <div className="max-h-[70vh] overflow-auto p-4">{children}</div>
    </section>
  );
}
