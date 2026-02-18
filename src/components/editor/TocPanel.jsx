import { useEditor, DOCUMENT_SEGMENTS } from '../../context/EditorContext';
import { useLayout } from '../../context/LayoutContext';
import { ChevronRight, ChevronDown, BookOpen, X } from 'lucide-react';
import { useState } from 'react';

export default function TocPanel() {
  const { headings, activeHeading, scrollToHeading, scrollToSegment, segments } = useEditor();
  const { toggles, toggle } = useLayout();
  const [expandedSections, setExpandedSections] = useState({
    [DOCUMENT_SEGMENTS.INTRODUCTION]: true,
    [DOCUMENT_SEGMENTS.SECTION_1]: true,
    [DOCUMENT_SEGMENTS.SECTION_2]: true,
    [DOCUMENT_SEGMENTS.CONCLUSION]: true
  });

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

  if (!toggles.showToc) {
    return (
      <button
        onClick={() => toggle('showToc')}
        className="fixed left-4 top-24 z-40 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        title="Show Table of Contents"
      >
        <BookOpen className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>
    );
  }

  return (
    <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <span className="font-semibold text-gray-900 dark:text-white">Contents</span>
        </div>
        <button
          onClick={() => toggle('showToc')}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* TOC Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Document Sections */}
        <div className="space-y-2 mb-6">
          {Object.values(DOCUMENT_SEGMENTS).map((segment) => (
            <div key={segment}>
              <button
                onClick={() => {
                  toggleSection(segment);
                  scrollToSegment(segment);
                }}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <span>{sectionLabels[segment]}</span>
                {expandedSections[segment] ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
              
              {expandedSections[segment] && (
                <div className="ml-4 mt-1 space-y-1">
                  {getSectionHeadings(segment).map((heading) => (
                    <button
                      key={heading.id}
                      onClick={() => scrollToHeading(heading.id)}
                      className={`w-full text-left px-2 py-1 rounded text-sm transition-colors ${
                        activeHeading === heading.id
                          ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                      style={{ paddingLeft: `${heading.level * 8}px` }}
                    >
                      {heading.text}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* All Headings */}
        {headings.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider mb-2">
              All Headings
            </h4>
            <div className="space-y-1">
              {headings.map((heading) => (
                <button
                  key={heading.id}
                  onClick={() => scrollToHeading(heading.id)}
                  className={`w-full text-left px-2 py-1 rounded text-sm transition-colors ${
                    activeHeading === heading.id
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  style={{ paddingLeft: `${heading.level * 12}px` }}
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
