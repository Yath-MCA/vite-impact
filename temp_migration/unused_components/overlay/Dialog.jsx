import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function Dialog({ open, title, children, onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeydown = (event) => {
      if (event.key === 'Escape' && onClose) {
        onClose();
      }
    };

    const previousActive = document.activeElement;
    dialogRef.current?.focus();
    window.addEventListener('keydown', handleKeydown);

    return () => {
      window.removeEventListener('keydown', handleKeydown);
      if (previousActive && previousActive.focus) {
        previousActive.focus();
      }
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center" role="presentation">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <section
        ref={dialogRef}
        className="relative z-[81] w-[min(680px,calc(100vw-2rem))] rounded-xl bg-white shadow-2xl outline-none"
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Dialog'}
        tabIndex={-1}
      >
        <header className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <h2 className="text-sm font-semibold text-gray-800">{title || 'Dialog'}</h2>
          <button
            type="button"
            className="rounded-md p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="max-h-[70vh] overflow-auto p-5">{children}</div>
      </section>
    </div>
  );
}
