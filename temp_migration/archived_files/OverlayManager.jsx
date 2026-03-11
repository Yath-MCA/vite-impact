import { useOverlay, OVERLAY_TYPES } from './OverlayProvider';
import Dialog from './Dialog';
import Popout from './Popout';
import Sidebar from './Sidebar';
import Dock from './Dock';

export default function OverlayManager() {
  const { overlays, minimizedOverlays, focusOverlay } = useOverlay();

  const renderOverlay = (overlay) => {
    const commonProps = {
      key: overlay.id,
      overlay,
      onFocus: () => focusOverlay(overlay.id)
    };

    switch (overlay.type) {
      case OVERLAY_TYPES.DIALOG:
        return <Dialog {...commonProps} />;
      case OVERLAY_TYPES.POPOUT:
        return <Popout {...commonProps} />;
      case OVERLAY_TYPES.SIDEBAR:
        return <Sidebar {...commonProps} />;
      default:
        return <Dialog {...commonProps} />;
    }
  };

  return (
    <>
      {/* Render active overlays */}
      {Array.from(overlays.values())
        .filter(o => !o.isMinimized)
        .sort((a, b) => a.zIndex - b.zIndex)
        .map(renderOverlay)}
      
      {/* Render dock for minimized overlays */}
      {minimizedOverlays.size > 0 && <Dock />}
    </>
  );
}
