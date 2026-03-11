import { memo, useMemo, useRef, useState } from 'react';
import { CheckCircle2, MessageCircle } from 'lucide-react';

const SAMPLE_THREADS = [
  {
    id: 'thread-1',
    anchor: 'heading-1',
    resolved: false,
    messages: [
      { id: 'm1', author: 'Editor', text: 'Please confirm this paragraph order.' },
      { id: 'm2', author: 'Author', text: 'Confirmed. Keep as is.' }
    ]
  },
  {
    id: 'thread-2',
    anchor: 'heading-2',
    resolved: true,
    messages: [{ id: 'm3', author: 'Production', text: 'Table caption style corrected.' }]
  }
];

function Comments({ onJump }) {
  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const ITEM_HEIGHT = 124;
  const OVERSCAN = 3;

  const threads = useMemo(() => {
    return Array.from({ length: 120 }, (_, index) => {
      const base = SAMPLE_THREADS[index % SAMPLE_THREADS.length];
      return {
        ...base,
        id: `${base.id}-${index + 1}`,
        anchor: `heading-${index % 10}`
      };
    });
  }, []);

  const viewportHeight = containerRef.current?.clientHeight || 420;
  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN);
  const visibleCount = Math.ceil(viewportHeight / ITEM_HEIGHT) + OVERSCAN * 2;
  const endIndex = Math.min(threads.length, startIndex + visibleCount);
  const visibleThreads = threads.slice(startIndex, endIndex);

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto px-2 py-2"
      onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
    >
      <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
        Comment Threads
      </div>
      <div className="relative" style={{ height: `${threads.length * ITEM_HEIGHT}px` }}>
        {visibleThreads.map((thread, visibleIndex) => {
          const index = startIndex + visibleIndex;
          return (
          <article
            key={thread.id}
            className="absolute left-0 right-0 rounded-lg border border-gray-200 bg-white p-2"
            style={{ top: `${index * ITEM_HEIGHT}px` }}
          >
            <button
              type="button"
              className="mb-2 flex w-full items-center gap-2 rounded-md px-1 py-1 text-left text-xs font-semibold text-gray-600 hover:bg-gray-50"
              onClick={() => onJump && onJump(thread.anchor)}
            >
              <MessageCircle className="h-3.5 w-3.5 text-gray-400" />
              {thread.id}
              <span className={`ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${thread.resolved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                {thread.resolved ? <CheckCircle2 className="h-3 w-3" /> : null}
                {thread.resolved ? 'Resolved' : 'Open'}
              </span>
            </button>
            <div className="space-y-1">
              {thread.messages.map((message) => (
                <div key={message.id} className="rounded bg-gray-50 px-2 py-1.5 text-xs text-gray-700">
                  <span className="mr-1 font-semibold text-gray-600">{message.author}:</span>
                  {message.text}
                </div>
              ))}
            </div>
          </article>
        )})}
      </div>
    </div>
  );
}

export default memo(Comments);
