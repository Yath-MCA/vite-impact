import { useState, useRef, useEffect } from 'react';
import { useOverlay, OVERLAY_TYPES } from './OverlayProvider';
import { 
  Minus, 
  Maximize2, 
  Minimize2, 
  X, 
  LayoutTemplate,
  PanelRight,
  Square,
  Type
} from 'lucide-react';

export default function Header({ 
  title, 
  type, 
  overlayId, 
  onMinimize, 
  onClose, 
  onToggleFullscreen, 
  isFullscreen 
}) {
  const { switchOverlayType } = useOverlay();
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowTypeMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTypeSwitch = (newType) => {
    switchOverlayType(overlayId, newType);
    setShowTypeMenu(false);
  };

  const typeOptions = [
    { type: OVERLAY_TYPES.DIALOG, icon: Square, label: 'Dialog' },
    { type: OVERLAY_TYPES.POPOUT, icon: LayoutTemplate, label: 'Popout' },
    { type: OVERLAY_TYPES.SIDEBAR, icon: PanelRight, label: 'Sidebar' }
  ];

  return (
    <div 
      data-testid="overlay-header"
      className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-t-xl"
    >
      {/* Left: Title */}
      <div className="flex items-center gap-2">
        <span 
          data-testid="overlay-title"
          id={`overlay-title-${overlayId}`}
          className="font-semibold text-gray-900 dark:text-white truncate max-w-[200px]"
        >
          {title}
        </span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        {/* Type Switcher */}
        <div className="relative" ref={menuRef}>
          <button
            data-testid="overlay-type-switcher"
            onClick={() => setShowTypeMenu(!showTypeMenu)}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Switch Type"
            aria-expanded={showTypeMenu}
            aria-haspopup="true"
          >
            <Type className="w-4 h-4" aria-hidden="true" />
          </button>

          {showTypeMenu && (
            <div 
              data-testid="overlay-type-menu"
              className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50"
            >
              {typeOptions.map(({ type: optionType, icon: Icon, label }) => (
                <button
                  key={optionType}
                  data-testid={`overlay-type-option-${optionType}`}
                  onClick={() => handleTypeSwitch(optionType)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                    type === optionType
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />

        {/* Minimize */}
        <button
          data-testid="overlay-minimize-btn"
          onClick={onMinimize}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Minimize"
          aria-label="Minimize overlay"
        >
          <Minus className="w-4 h-4" aria-hidden="true" />
        </button>

        {/* Fullscreen Toggle */}
        <button
          data-testid="overlay-fullscreen-btn"
          onClick={onToggleFullscreen}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" aria-hidden="true" /> : <Maximize2 className="w-4 h-4" aria-hidden="true" />}
        </button>

        {/* Close */}
        <button
          data-testid="overlay-close-btn"
          onClick={onClose}
          className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
          title="Close"
          aria-label="Close overlay"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
