import { useEffect, useMemo, useRef, useState } from 'react';

const DEFAULT_WIDTHS = {
  navigation: 280,
  thumbnail: 132,
  editorRatio: 0.58
};

export function useLayoutEngine() {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const [isThumbnailOpen, setIsThumbnailOpen] = useState(false);
  const [widths, setWidths] = useState(DEFAULT_WIDTHS);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return undefined;

    const observer = new ResizeObserver((entries) => {
      const nextWidth = entries[0]?.contentRect?.width || 0;
      setContainerWidth(nextWidth);
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const isCompact = containerWidth > 0 && containerWidth < 1100;

  const gridTemplateColumns = useMemo(() => {
    const navWidth = isNavigationOpen && !isCompact ? widths.navigation : 0;
    const thumbWidth = isThumbnailOpen && !isCompact ? widths.thumbnail : 0;
    const available = Math.max(640, containerWidth - navWidth - thumbWidth);
    const editorWidth = Math.max(380, Math.floor(available * widths.editorRatio));
    const previewWidth = Math.max(260, available - editorWidth);

    if (isCompact) {
      return 'minmax(0, 1fr)';
    }

    return `${navWidth}px minmax(0, ${editorWidth}px) minmax(0, ${previewWidth}px) ${thumbWidth}px`;
  }, [containerWidth, isCompact, isNavigationOpen, isThumbnailOpen, widths]);

  const panelState = useMemo(
    () => ({
      navigation: isNavigationOpen,
      thumbnail: isThumbnailOpen
    }),
    [isNavigationOpen, isThumbnailOpen]
  );

  return {
    containerRef,
    containerWidth,
    isCompact,
    panelState,
    gridTemplateColumns,
    widths,
    setWidths,
    isNavigationOpen,
    isThumbnailOpen,
    setIsNavigationOpen,
    setIsThumbnailOpen,
    toggleNavigation: () => setIsNavigationOpen((prev) => !prev),
    toggleThumbnail: () => setIsThumbnailOpen((prev) => !prev)
  };
}
