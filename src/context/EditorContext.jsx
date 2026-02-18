import { createContext, useContext, useState, useCallback, useRef } from 'react';

const EditorContext = createContext();

export const VIEW_MODES = {
  EDITOR: 'editor',
  PDF: 'pdf',
  SPLIT: 'split'
};

export const DOCUMENT_SEGMENTS = {
  INTRODUCTION: 'introduction',
  SECTION_1: 'section-1',
  SECTION_2: 'section-2',
  CONCLUSION: 'conclusion'
};

export function EditorProvider({ children }) {
  const [content, setContent] = useState('');
  const [viewMode, setViewMode] = useState(VIEW_MODES.EDITOR);
  const [headings, setHeadings] = useState([]);
  const [activeHeading, setActiveHeading] = useState(null);
  const [segments, setSegments] = useState({
    [DOCUMENT_SEGMENTS.INTRODUCTION]: { start: 0, end: 0, content: '' },
    [DOCUMENT_SEGMENTS.SECTION_1]: { start: 0, end: 0, content: '' },
    [DOCUMENT_SEGMENTS.SECTION_2]: { start: 0, end: 0, content: '' },
    [DOCUMENT_SEGMENTS.CONCLUSION]: { start: 0, end: 0, content: '' }
  });
  const [thumbnails, setThumbnails] = useState([]);
  const editorRef = useRef(null);
  const contentRef = useRef(null);

  const extractHeadings = useCallback((htmlContent) => {
    if (!htmlContent) return [];
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const headingElements = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    return Array.from(headingElements).map((heading, index) => ({
      id: `heading-${index}`,
      level: parseInt(heading.tagName[1]),
      text: heading.textContent,
      element: heading
    }));
  }, []);

  const updateContent = useCallback((newContent) => {
    setContent(newContent);
    const extractedHeadings = extractHeadings(newContent);
    setHeadings(extractedHeadings);
    
    // Split content into 4 segments
    const totalLength = newContent.length;
    const segmentSize = Math.ceil(totalLength / 4);
    
    setSegments({
      [DOCUMENT_SEGMENTS.INTRODUCTION]: {
        start: 0,
        end: segmentSize,
        content: newContent.substring(0, segmentSize)
      },
      [DOCUMENT_SEGMENTS.SECTION_1]: {
        start: segmentSize,
        end: segmentSize * 2,
        content: newContent.substring(segmentSize, segmentSize * 2)
      },
      [DOCUMENT_SEGMENTS.SECTION_2]: {
        start: segmentSize * 2,
        end: segmentSize * 3,
        content: newContent.substring(segmentSize * 2, segmentSize * 3)
      },
      [DOCUMENT_SEGMENTS.CONCLUSION]: {
        start: segmentSize * 3,
        end: totalLength,
        content: newContent.substring(segmentSize * 3)
      }
    });

    // Generate thumbnails based on segments
    setThumbnails([
      { id: 1, segment: DOCUMENT_SEGMENTS.INTRODUCTION, label: 'Page 1' },
      { id: 2, segment: DOCUMENT_SEGMENTS.SECTION_1, label: 'Page 2' },
      { id: 3, segment: DOCUMENT_SEGMENTS.SECTION_2, label: 'Page 3' },
      { id: 4, segment: DOCUMENT_SEGMENTS.CONCLUSION, label: 'Page 4' }
    ]);
  }, [extractHeadings]);

  const scrollToHeading = useCallback((headingId) => {
    setActiveHeading(headingId);
    const element = document.getElementById(headingId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const scrollToSegment = useCallback((segmentKey) => {
    const segment = segments[segmentKey];
    if (segment && contentRef.current) {
      // Scroll to approximate position
      const scrollPercent = segment.start / content.length;
      const scrollHeight = contentRef.current.scrollHeight;
      contentRef.current.scrollTo({
        top: scrollHeight * scrollPercent,
        behavior: 'smooth'
      });
    }
  }, [segments, content.length]);

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

  const value = {
    content,
    viewMode,
    headings,
    activeHeading,
    segments,
    thumbnails,
    editorRef,
    contentRef,
    setViewMode,
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
