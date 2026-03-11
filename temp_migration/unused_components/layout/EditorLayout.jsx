import { useMemo } from 'react';
import { useLayoutEngine } from '../../hooks/useLayoutEngine';
import '../../styles/editor-layout.css';

export default function EditorLayout({
  navigation,
  editor,
  preview,
  thumbnail,
  className = ''
}) {
  const {
    containerRef,
    isCompact,
    gridTemplateColumns,
    isNavigationOpen,
    isThumbnailOpen
  } = useLayoutEngine();

  const compactArea = useMemo(() => (
    <>
      <section className="layout-panel layout-panel--editor">{editor}</section>
      <section className="layout-panel layout-panel--preview">{preview}</section>
      {isNavigationOpen && <section className="layout-panel layout-panel--overlay">{navigation}</section>}
      {isThumbnailOpen && <section className="layout-panel layout-panel--overlay layout-panel--overlay-right">{thumbnail}</section>}
    </>
  ), [editor, preview, navigation, thumbnail, isNavigationOpen, isThumbnailOpen]);

  return (
    <main ref={containerRef} className={`editor-layout ${className}`.trim()}>
      {isCompact ? (
        compactArea
      ) : (
        <div className="editor-layout__grid" style={{ gridTemplateColumns }}>
          <aside className={`layout-panel layout-panel--nav ${isNavigationOpen ? 'is-open' : 'is-closed'}`}>
            {isNavigationOpen ? navigation : null}
          </aside>
          <section className="layout-panel layout-panel--editor">{editor}</section>
          <section className="layout-panel layout-panel--preview">{preview}</section>
          <aside className={`layout-panel layout-panel--thumb ${isThumbnailOpen ? 'is-open' : 'is-closed'}`}>
            {isThumbnailOpen ? thumbnail : null}
          </aside>
        </div>
      )}
    </main>
  );
}
