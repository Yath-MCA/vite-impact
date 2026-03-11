import { useEffect, useRef, useState } from 'react';
import { Grip, X } from 'lucide-react';

export default function Popout({ open, title, children, onClose, initialPosition }) {
  const [position, setPosition] = useState(initialPosition || { x: 140, y: 140 });
  const [size, setSize] = useState({ width: 420, height: 320 });
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const dragRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!open) return undefined;

    const handleMove = (event) => {
      if (dragging) {
        setPosition({
          x: Math.max(8, event.clientX - dragRef.current.x),
          y: Math.max(8, event.clientY - dragRef.current.y)
        });
      }

      if (resizing) {
        setSize((prev) => ({
          width: Math.max(320, event.clientX - position.x),
          height: Math.max(240, event.clientY - position.y)
        }));
      }
    };

    const handleUp = () => {
      setDragging(false);
      setResizing(false);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);

    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [dragging, open, position.x, position.y, resizing]);

  if (!open) return null;

  return (
    <section
      className="fixed z-[85] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl"
      style={{ left: position.x, top: position.y, width: size.width, height: size.height }}
      role="dialog"
      aria-modal="false"
      aria-label={title || 'Popout'}
    >
      <header
        className="flex cursor-move items-center justify-between border-b border-gray-200 bg-gray-50 px-3 py-2"
        onPointerDown={(event) => {
          const rect = event.currentTarget.parentElement.getBoundingClientRect();
          dragRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
          setDragging(true);
        }}
      >
        <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
          <Grip className="h-4 w-4 text-gray-400" />
          {title || 'Popout'}
        </div>
        <button
          type="button"
          className="rounded-md p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
          onClick={onClose}
          aria-label="Close popout"
        >
          <X className="h-4 w-4" />
        </button>
      </header>
      <div className="h-[calc(100%-40px)] overflow-auto p-4">{children}</div>
      <button
        type="button"
        className="absolute bottom-0 right-0 h-4 w-4 cursor-se-resize rounded-tl bg-gray-200"
        onPointerDown={() => setResizing(true)}
        aria-label="Resize popout"
      />
    </section>
  );
}
