import { useState, useRef, useEffect } from 'react';
import { useOverlay } from './OverlayProvider';
import Header from './Header';
import Footer from './Footer';

export default function Popout({ overlay, onFocus }) {
  const { closeOverlay, minimizeOverlay, toggleFullscreen, updateOverlayPosition, updateOverlaySize } = useOverlay();
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, startLeft: 0, startTop: 0 });
  const resizeRef = useRef({ startX: 0, startY: 0, startWidth: 0, startHeight: 0 });
  const elementRef = useRef(null);

  const handleMouseDown = (e) => {
    if (e.target.closest('.resize-handle')) return;
    if (overlay.isFullscreen) return;
    
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startLeft: overlay.position.x,
      startTop: overlay.position.y
    };
  };

  const handleResizeMouseDown = (e) => {
    e.stopPropagation();
    if (overlay.isFullscreen) return;
    
    setIsResizing(true);
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: overlay.size.width,
      startHeight: overlay.size.height
    };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        
        updateOverlayPosition(overlay.id, {
          x: Math.max(0, dragRef.current.startLeft + dx),
          y: Math.max(0, dragRef.current.startTop + dy)
        });
      }

      if (isResizing) {
        const dx = e.clientX - resizeRef.current.startX;
        const dy = e.clientY - resizeRef.current.startY;
        
        updateOverlaySize(overlay.id, {
          width: Math.max(300, resizeRef.current.startWidth + dx),
          height: Math.max(200, resizeRef.current.startHeight + dy)
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, overlay.id, updateOverlayPosition, updateOverlaySize]);

  const handleAction = (action) => {
    overlay.onAction?.(action, overlay.props);
    if (action === 'close') {
      closeOverlay(overlay.id);
    }
  };

  const style = overlay.isFullscreen ? {
    position: 'fixed',
    left: 0,
    top: 0,
    width: '100vw',
    height: '100vh',
    zIndex: overlay.zIndex
  } : {
    position: 'fixed',
    left: overlay.position.x,
    top: overlay.position.y,
    width: overlay.size.width,
    height: overlay.size.height,
    zIndex: overlay.zIndex
  };

  return (
    <div
      ref={elementRef}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col overflow-hidden"
      style={style}
      onClick={onFocus}
    >
      <div onMouseDown={handleMouseDown} className={isDragging ? 'cursor-grabbing' : 'cursor-grab'}>
        <Header
          title={overlay.title}
          type={overlay.type}
          overlayId={overlay.id}
          onMinimize={() => minimizeOverlay(overlay.id)}
          onClose={() => closeOverlay(overlay.id)}
          onToggleFullscreen={() => toggleFullscreen(overlay.id)}
          isFullscreen={overlay.isFullscreen}
        />
      </div>
      
      <div className="flex-1 overflow-auto p-6">
        <overlay.component {...overlay.props} />
      </div>

      {overlay.footerType !== 'none' && (
        <Footer
          type={overlay.footerType}
          onAction={handleAction}
          config={overlay.actionConfig}
        />
      )}

      {/* Resize handle */}
      {!overlay.isFullscreen && (
        <div
          className="resize-handle absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          onMouseDown={handleResizeMouseDown}
        >
          <svg className="w-4 h-4 text-gray-400" viewBox="0 0 16 16" fill="currentColor">
            <path d="M11 11h4v4h-4zM6 11h4v4H6zM11 6h4v4h-4z" />
          </svg>
        </div>
      )}
    </div>
  );
}
