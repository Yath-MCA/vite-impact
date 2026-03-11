import { memo, useMemo, useRef, useState } from 'react';
import { ChevronRight, FileStack } from 'lucide-react';
import { useEditor } from '../../context/EditorContext';

const nodeTypeStyle = {
  section: 'text-gray-700',
  subsection: 'text-gray-600',
  figure: 'text-orange-600',
  table: 'text-blue-600'
};

function Toc({ onNavigate }) {
  const { headings, scrollToHeading } = useEditor();
  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);

  const ITEM_HEIGHT = 30;
  const OVERSCAN = 8;

  const nodes = useMemo(() => {
    if (!headings.length) return [];

    return headings.map((heading, index) => {
      const type = heading.tagName === 'h1'
        ? 'section'
        : heading.tagName === 'h2'
          ? 'subsection'
          : index % 5 === 0
            ? 'figure'
            : index % 7 === 0
              ? 'table'
              : 'subsection';

      return {
        id: heading.id,
        label: heading.text || `Untitled ${index + 1}`,
        level: heading.level,
        type
      };
    });
  }, [headings]);

  if (!nodes.length) {
    return (
      <div className="flex h-full items-center justify-center px-4 text-xs text-gray-500">
        No structural headings found yet.
      </div>
    );
  }

  const viewportHeight = containerRef.current?.clientHeight || 420;
  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN);
  const visibleCount = Math.ceil(viewportHeight / ITEM_HEIGHT) + OVERSCAN * 2;
  const endIndex = Math.min(nodes.length, startIndex + visibleCount);
  const visibleNodes = nodes.slice(startIndex, endIndex);

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto px-2 py-2"
      onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
    >
      <div className="mb-2 flex items-center gap-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
        <FileStack className="h-3.5 w-3.5" />
        Document Structure
      </div>
      <ul className="relative" style={{ height: `${nodes.length * ITEM_HEIGHT}px` }}>
        {visibleNodes.map((node, visibleIndex) => {
          const index = startIndex + visibleIndex;
          return (
          <li key={node.id} className="absolute left-0 right-0" style={{ top: `${index * ITEM_HEIGHT}px` }}>
            <button
              type="button"
              onClick={() => {
                scrollToHeading(node.id);
                if (onNavigate) onNavigate(node.id);
              }}
              className="flex h-[28px] w-full items-center gap-2 rounded-md px-2 text-left text-xs transition-colors hover:bg-orange-50"
              style={{ paddingLeft: `${Math.max(8, node.level * 8)}px` }}
            >
              <ChevronRight className="h-3 w-3 text-gray-400" />
              <span className={`${nodeTypeStyle[node.type] || 'text-gray-700'} truncate`}>
                {node.label}
              </span>
            </button>
          </li>
        )})}
      </ul>
    </div>
  );
}

export default memo(Toc);
