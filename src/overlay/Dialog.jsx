import { useOverlay } from './OverlayProvider';
import Header from './Header';
import Footer from './Footer';

export default function Dialog({ overlay, onFocus }) {
  const { closeOverlay, minimizeOverlay, toggleFullscreen } = useOverlay();

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && overlay.dropOver) {
      closeOverlay(overlay.id);
    }
  };

  const handleAction = (action) => {
    overlay.onAction?.(action, overlay.props);
    if (action === 'close') {
      closeOverlay(overlay.id);
    }
  };

  const contentStyle = overlay.isFullscreen ? {
    width: '100vw',
    height: '100vh',
    maxWidth: 'none',
    borderRadius: 0
  } : {
    width: overlay.size.width,
    height: overlay.size.height,
    maxWidth: '90vw',
    maxHeight: '90vh'
  };

  return (
    <div
      data-testid="overlay-backdrop"
      className={`fixed inset-0 flex items-center justify-center transition-opacity duration-200 ${
        overlay.dropOver ? 'bg-black/50 backdrop-blur-sm' : 'pointer-events-none'
      }`}
      style={{ zIndex: overlay.zIndex }}
      onClick={handleBackdropClick}
    >
      <div
        data-testid="overlay-container"
        data-testid-dialog="overlay-dialog"
        data-overlay-id={overlay.id}
        data-overlay-type={overlay.type}
        data-fullscreen={overlay.isFullscreen}
        data-module-name={overlay.moduleName}
        data-drop-over={overlay.dropOver}
        role="dialog"
        aria-modal={overlay.dropOver ? 'true' : 'false'}
        aria-labelledby={`overlay-title-${overlay.id}`}
        className={`bg-white dark:bg-gray-800 shadow-2xl flex flex-col pointer-events-auto transition-all duration-200 ${
          overlay.isFullscreen ? '' : 'rounded-xl'
        }`}
        style={contentStyle}
        onClick={onFocus}
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
        
        <div data-testid="overlay-content" className="flex-1 overflow-auto p-6">
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
    </div>
  );
}
