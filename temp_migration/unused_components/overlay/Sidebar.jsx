import { X } from 'lucide-react';

export default function Sidebar({ open, title, children, onClose }) {
  return (
    <div
      className={`fixed inset-y-0 right-0 z-[75] w-[min(420px,90vw)] border-l border-gray-200 bg-white shadow-2xl transition-transform duration-200 ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}
      role="dialog"
      aria-modal="false"
      aria-label={title || 'Sidebar'}
    >
      <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-800">{title || 'Sidebar'}</h2>
        <button
          type="button"
          className="rounded-md p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <X className="h-4 w-4" />
        </button>
      </header>
      <div className="h-[calc(100%-49px)] overflow-auto p-4">{children}</div>
    </div>
  );
}
