import { useEffect } from 'react';
import { useEditor, VIEW_MODES } from '../../context/EditorContext';

export default function PdfPreview() {
  const { content, contentRef, setActiveHeading } = useEditor();

  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const handleScroll = () => {
      const headingElements = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
      let currentHeadingId = null;

      for (const el of headingElements) {
        const rect = el.getBoundingClientRect();
        // Check if heading is near top of container
        const containerRect = container.getBoundingClientRect();
        const topRelativeToContainer = rect.top - containerRect.top;

        if (topRelativeToContainer >= 0 && topRelativeToContainer <= 100) {
          currentHeadingId = el.id;
          break;
        }
      }

      if (currentHeadingId) {
        setActiveHeading(currentHeadingId);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [contentRef, setActiveHeading]);

  return (
    <div
      ref={contentRef}
      className="h-full overflow-y-auto bg-gray-100 dark:bg-gray-800 p-8 scroll-smooth"
    >
      {/* A4 Page Container */}
      <div className="max-w-[210mm] mx-auto bg-white dark:bg-gray-900 shadow-lg min-h-[297mm]">
        {/* Page Content */}
        <div className="p-[25mm]">
          <div
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </div>

      {/* Page Indicators */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {[1, 2, 3, 4].map((page) => (
          <div
            key={page}
            className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-600"
          />
        ))}
      </div>
    </div>
  );
}
