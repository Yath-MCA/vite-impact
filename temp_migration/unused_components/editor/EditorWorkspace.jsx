import { memo, useCallback, useMemo, useState } from 'react';
import { BookText, Table2, Sigma, Image as ImageIcon, Quote } from 'lucide-react';

const TOOLBAR = [
  { id: 'inline', label: 'Inline', icon: BookText },
  { id: 'math', label: 'Math', icon: Sigma },
  { id: 'table', label: 'Table', icon: Table2 },
  { id: 'figure', label: 'Figure', icon: ImageIcon },
  { id: 'citation', label: 'Citation', icon: Quote }
];

function EditorWorkspace({ value, onChange }) {
  const [activeTool, setActiveTool] = useState('inline');

  const handleInput = useCallback((event) => {
    if (!onChange) return;
    onChange(event.currentTarget.innerHTML);
  }, [onChange]);

  const initialMarkup = useMemo(() => value || '<p>Start editing your manuscript...</p>', [value]);

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-gray-200 bg-white">
      <header className="flex items-center gap-1 overflow-x-auto border-b border-gray-200 bg-gray-50 px-2 py-2">
        {TOOLBAR.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            title={label}
            aria-label={label}
            onClick={() => setActiveTool(id)}
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
              activeTool === id
                ? 'bg-orange-100 text-orange-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto bg-[#faf8f4] p-4">
        <div
          className="mx-auto min-h-[70vh] max-w-4xl rounded-sm border border-gray-200 bg-white p-8 shadow-sm outline-none"
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          onInput={handleInput}
          dangerouslySetInnerHTML={{ __html: initialMarkup }}
        />
      </div>
    </section>
  );
}

export default memo(EditorWorkspace);
