import { useEditor, DOCUMENT_SEGMENTS } from '../../context/EditorContext';
import { useLayout } from '../../context/LayoutContext';
import { ChevronRight, ChevronDown, BookOpen, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function TocPanel() {
  const {
    headings,
    activeHeading,
    activeSegment,
    scrollToHeading,
    scrollToSegment,
    segments
  } = useEditor();
  const { toggle } = useLayout();
  const [expandedSections, setExpandedSections] = useState({
    [DOCUMENT_SEGMENTS.INTRODUCTION]: true,
    [DOCUMENT_SEGMENTS.SECTION_1]: true,
    [DOCUMENT_SEGMENTS.SECTION_2]: true,
    [DOCUMENT_SEGMENTS.CONCLUSION]: true
  });

  // Automatically expand active segment
  useEffect(() => {
    if (activeSegment) {
      setExpandedSections(prev => ({
        ...prev,
        [activeSegment]: true
      }));
    }
  }, [activeSegment]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getSectionHeadings = (segmentKey) => {
    const segment = segments[segmentKey];
    if (!segment || !headings.length) return [];

    return headings.filter((_, index) => {
      const position = (index / headings.length) * 100;
      const segmentStart = (segment.start / (segment.end || 1)) * 100;
      const segmentEnd = (segment.end / (segment.end || 1)) * 100;
      return position >= segmentStart && position <= segmentEnd;
    });
  };

  const sectionLabels = {
    [DOCUMENT_SEGMENTS.INTRODUCTION]: 'Introduction',
    [DOCUMENT_SEGMENTS.SECTION_1]: 'Section 1',
    [DOCUMENT_SEGMENTS.SECTION_2]: 'Section 2',
    [DOCUMENT_SEGMENTS.CONCLUSION]: 'Conclusion'
  };

  return (
    <aside className="h-full bg-white dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Navigation</span>
        </div>
        <button
          onClick={() => toggle('showToc')}
          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <X className="w-3 h-3 text-gray-400" />
        </button>
      </div>

      {/* TOC Content */}
      <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
        {/* Document Sections */}
        <div className="space-y-1 mb-4">
          {Object.values(DOCUMENT_SEGMENTS).map((segment) => (
            <div key={segment}>
              <button
                onClick={() => {
                  toggleSection(segment);
                  scrollToSegment(segment);
                }}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded transition-colors ${activeSegment === segment
                  ? 'bg-gray-100 dark:bg-gray-800 text-primary-600 font-bold'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
              >
                <span className="text-xs">{sectionLabels[segment]}</span>
                {expandedSections[segment] ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </button>

              {expandedSections[segment] && (
                <div className="ml-2 mt-1 space-y-0.5">
                  {getSectionHeadings(segment).map((heading) => (
                    <button
                      key={heading.id}
                      onClick={() => scrollToHeading(heading.id)}
                      className={`w-full text-left px-2 py-1 rounded text-xs transition-colors truncate ${activeHeading === heading.id
                        ? 'bg-primary-50 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 font-medium border-l-2 border-primary-500'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      style={{ paddingLeft: `${heading.level * 4 + 8}px` }}
                    >
                      {heading.text}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* All Headings (Flat view for quick search) */}
        {headings.length > 0 && (
          <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
            <h4 className="px-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
              All Items
            </h4>
            <div className="space-y-0.5">
              {headings.slice(0, 50).map((heading) => (
                <button
                  key={heading.id}
                  onClick={() => scrollToHeading(heading.id)}
                  className={`w-full text-left px-2 py-1.5 rounded text-[11px] transition-colors truncate ${activeHeading === heading.id
                    ? 'bg-primary-50 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 font-black'
                    : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  style={{ paddingLeft: `${heading.level * 6}px` }}
                >
                  {heading.text}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
