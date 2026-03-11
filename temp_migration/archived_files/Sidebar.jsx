import { useOverlay } from './OverlayProvider';
import Header from './Header';
import Footer from './Footer';

export default function Sidebar({ overlay, onFocus }) {
  const { closeOverlay, minimizeOverlay, toggleFullscreen } = useOverlay();

  const handleBackdropClick = () => {
    if (overlay.dropOver) {
      closeOverlay(overlay.id);
    }
  };

  const handleAction = (action) => {
    overlay.onAction?.(action, overlay.props);
    if (action === 'close') {
      closeOverlay(overlay.id);
    }
  };

  const width = overlay.isFullscreen ? '100vw' : (overlay.size.width || 400);

  return (
    <div
      className={`fixed inset-0 transition-opacity duration-300 ${
        overlay.dropOver ? 'bg-black/30' : 'pointer-events-none'
      }`}
      style={{ zIndex: overlay.zIndex }}
      onClick={handleBackdropClick}
    >
      <div
        className="absolute right-0 top-0 h-full bg-white dark:bg-gray-800 shadow-2xl flex flex-col pointer-events-auto animate-slide-in"
        style={{ 
          width,
          animation: 'slideIn 0.3s ease-out'
        }}
        onClick={(e) => {
          e.stopPropagation();
          onFocus();
        }}
      >
        <Header
          title={overlay.title}
          type={overlay.type}
          overlayId={overlay.id}
          onMinimize={() => minimizeOverlay(overlay.id)}
          onClose={() => closeOverlay(overlay.id)}
          onToggleFullscreen={() => toggleFullscreen(overlay.id)}
          isFullscreen={overlay.isFullscreen}
        />
        
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
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
