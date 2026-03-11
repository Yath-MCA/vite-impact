import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

const EditorContext = createContext();

export const VIEW_MODES = {
  EDITOR: 'editor',
  PDF: 'pdf',
  SPLIT: 'split',
  FOUR_COLUMN: 'four-column'
};

export const DOCUMENT_SEGMENTS = {
  INTRODUCTION: 'introduction',
  SECTION_1: 'section-1',
  SECTION_2: 'section-2',
  CONCLUSION: 'conclusion'
};

export function EditorProvider({ children }) {
  const [content, setContent] = useState('');
  const [viewMode, setViewMode] = useState(VIEW_MODES.FOUR_COLUMN);
  const [headings, setHeadings] = useState([]);
  const [activeHeading, setActiveHeading] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [segments, setSegments] = useState({
    [DOCUMENT_SEGMENTS.INTRODUCTION]: { start: 0, end: 0, content: '' },
    [DOCUMENT_SEGMENTS.SECTION_1]: { start: 0, end: 0, content: '' },
    [DOCUMENT_SEGMENTS.SECTION_2]: { start: 0, end: 0, content: '' },
    [DOCUMENT_SEGMENTS.CONCLUSION]: { start: 0, end: 0, content: '' }
  });
  const [thumbnails, setThumbnails] = useState([]);
  const [activeSegment, setActiveSegment] = useState(DOCUMENT_SEGMENTS.INTRODUCTION);
  const editorRef = useRef(null);
  const contentRef = useRef(null);

  const stripXmlHeaders = (html) => {
    if (!html) return '';
    // Remove XML prologue, DOCTYPE, and other headers before the first real tag (e.g., <html> or <div>)
    return html.replace(/^[\s\S]*?(?=<[a-zA-Z!/])/, '').trim();
  };

  const injectHeadingIds = useCallback((htmlContent) => {
    if (!htmlContent) return '';

    try {
      const sanitizedContent = stripXmlHeaders(htmlContent);

      const parser = new DOMParser();
      const doc = parser.parseFromString(sanitizedContent, 'text/html');

      // Check for parser errors (browsers might return a doc with a parsererror node)
      if (doc.querySelector('parsererror')) {
        console.warn('DOMParser encountered an error, returning raw content.');
        return sanitizedContent;
      }

      const headingElements = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');

      headingElements.forEach((heading, index) => {
        if (!heading.id) {
          heading.id = `heading-${index}`;
        }
      });

      return doc.body.innerHTML;
    } catch (error) {
      console.error('Failed to inject heading IDs:', error);
      return htmlContent;
    }
  }, []);

  const extractHeadings = useCallback((htmlContent) => {
    if (!htmlContent) return [];

    try {
      const sanitizedContent = stripXmlHeaders(htmlContent);

      const parser = new DOMParser();
      const doc = parser.parseFromString(sanitizedContent, 'text/html');

      if (doc.querySelector('parsererror')) {
        return [];
      }

      const headingElements = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');

      return Array.from(headingElements).map((heading, index) => ({
        id: heading.id || `heading-${index}`,
        level: parseInt(heading.tagName[1]),
        text: heading.textContent,
        tagName: heading.tagName.toLowerCase()
      }));
    } catch (error) {
      console.error('Failed to extract headings:', error);
      return [];
    }
  }, []);

  const updateContent = useCallback((newContent, skipIdInjection = false) => {
    const finalContent = skipIdInjection ? newContent : injectHeadingIds(newContent);
    setContent(finalContent);
    const extractedHeadings = extractHeadings(finalContent);
    setHeadings(extractedHeadings);

    // Split content into 4 segments based on headings if possible, otherwise by length
    const totalLength = finalContent.length;
    const segmentSize = Math.ceil(totalLength / 4);

    setSegments({
      [DOCUMENT_SEGMENTS.INTRODUCTION]: {
        start: 0,
        end: segmentSize,
        content: finalContent.substring(0, segmentSize)
      },
      [DOCUMENT_SEGMENTS.SECTION_1]: {
        start: segmentSize,
        end: segmentSize * 2,
        content: finalContent.substring(segmentSize, segmentSize * 2)
      },
      [DOCUMENT_SEGMENTS.SECTION_2]: {
        start: segmentSize * 2,
        end: segmentSize * 3,
        content: finalContent.substring(segmentSize * 2, segmentSize * 3)
      },
      [DOCUMENT_SEGMENTS.CONCLUSION]: {
        start: segmentSize * 3,
        end: totalLength,
        content: finalContent.substring(segmentSize * 3)
      }
    });

    setThumbnails([
      { id: 1, segment: DOCUMENT_SEGMENTS.INTRODUCTION, label: 'Page 1' },
      { id: 2, segment: DOCUMENT_SEGMENTS.SECTION_1, label: 'Page 2' },
      { id: 3, segment: DOCUMENT_SEGMENTS.SECTION_2, label: 'Page 3' },
      { id: 4, segment: DOCUMENT_SEGMENTS.CONCLUSION, label: 'Page 4' }
    ]);
  }, [extractHeadings, injectHeadingIds]);

  const scrollToHeading = useCallback((headingId) => {
    setActiveHeading(headingId);

    // Update active segment based on heading index
    const index = headings.findIndex(h => h.id === headingId);
    if (index !== -1) {
      const perSegment = Math.max(1, headings.length / 4);
      const segmentIndex = Math.min(3, Math.floor(index / perSegment));
      const segmentKey = Object.values(DOCUMENT_SEGMENTS)[segmentIndex];
      if (segmentKey) setActiveSegment(segmentKey);
    }

    // 1. Scroll in PDF Preview (if visible)
    if (contentRef.current) {
      const element = contentRef.current.querySelector(`#${headingId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    // 2. Scroll in CKEditor (if visible)
    if (editorRef.current) {
      const editor = editorRef.current.editor;
      if (editor) {
        const element = editor.document.getById(headingId);
        if (element) {
          // Use CKEditor's built-in scroll
          element.scrollIntoView(true);
        }
      }
    }
  }, [editorRef, contentRef]);

  const scrollToSegment = useCallback((segmentKey) => {
    const segmentIndex = Object.values(DOCUMENT_SEGMENTS).indexOf(segmentKey);
    // Find first heading in that segment range or just scroll to percentage
    const targetHeading = headings.find((h, i) => {
      const perHeading = headings.length / 4;
      return i >= Math.floor(segmentIndex * perHeading);
    });

    if (targetHeading) {
      scrollToHeading(targetHeading.id);
    } else if (contentRef.current) {
      const scrollPercent = segmentIndex / 4;
      contentRef.current.scrollTo({
        top: contentRef.current.scrollHeight * scrollPercent,
        behavior: 'smooth'
      });
    }
  }, [segments, content.length, headings, scrollToHeading]);

  const highlightSegment = useCallback((segmentKey) => {
    // Implementation for highlighting segments
    document.querySelectorAll('.segment-highlight').forEach(el => {
      el.classList.remove('segment-highlight');
    });

    const segmentElement = document.querySelector(`[data-segment="${segmentKey}"]`);
    if (segmentElement) {
      segmentElement.classList.add('segment-highlight');
    }
  }, []);

  // Sync active segment with active heading
  useEffect(() => {
    if (!activeHeading || !headings.length) return;

    const index = headings.findIndex(h => h.id === activeHeading);
    if (index !== -1) {
      const perSegment = Math.max(1, headings.length / 4);
      const segmentIndex = Math.min(3, Math.floor(index / perSegment));
      const segmentKey = Object.values(DOCUMENT_SEGMENTS)[segmentIndex];
      if (segmentKey && segmentKey !== activeSegment) {
        setActiveSegment(segmentKey);
      }
    }
  }, [activeHeading, headings, activeSegment]);

  const value = {
    content,
    viewMode,
    headings,
    activeHeading,
    activeSegment,
    isDirty,
    segments,
    thumbnails,
    editorRef,
    contentRef,
    setViewMode,
    setActiveHeading,
    setActiveSegment,
    setIsDirty,
    updateContent,
    scrollToHeading,
    scrollToSegment,
    highlightSegment,
    DOCUMENT_SEGMENTS
  };

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
}

export const useEditor = () => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor must be used within EditorProvider');
  }
  return context;
};
