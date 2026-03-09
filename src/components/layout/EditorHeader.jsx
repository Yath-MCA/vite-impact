import { Link } from 'react-router-dom';
import { useClient } from '../../context/ClientContext';
import { useLayout } from '../../context/LayoutContext';
import { useEditor, VIEW_MODES } from '../../context/EditorContext';
import { useModule } from '../../context/ModuleContext';
import {
  Menu, X, Sun, Moon, Monitor,
  FileText, Columns, LayoutTemplate,
  Settings, Palette, Image as ImageIcon,
  Maximize2, Minimize2, User
} from 'lucide-react';

const THEME_COLOR = '#ff8635';

export default function EditorHeader({ editorData }) {
  const { clientConfig } = useClient();
  const { toggles, toggle, theme, setTheme } = useLayout();
  const { viewMode, setViewMode } = useEditor();
  const { openModule } = useModule();

  const themeOptions = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ];

  const viewModeButtons = [
    { mode: VIEW_MODES.EDITOR, icon: FileText, label: 'Editor' },
    { mode: VIEW_MODES.PDF, icon: LayoutTemplate, label: 'Preview' },
    { mode: VIEW_MODES.SPLIT, icon: Columns, label: 'Split' },
  ];

  const actionIcons = [
    { id: 'styles', icon: Palette, title: 'Document Styles' },
    { id: 'media', icon: ImageIcon, title: 'Insert Media' },
    { id: 'settings', icon: Settings, title: 'Settings' },
  ];

  const plainText = (() => {
    if (!editorData) return '';
    try {
      const doc = new DOMParser().parseFromString(editorData, 'text/html');
      return doc.body?.textContent ?? '';
    } catch {
      return '';
    }
  })();
  const wordCount = plainText.split(/\s+/).filter((w) => w.length > 0).length;
  const charCount = plainText.length;

  return (
    /* sticky establishes a positioning context for the absolutely positioned floating icons */
    <header className="sticky top-0 z-50">
      {/* ===== NAVBAR 1 ===== */}
      <div style={{ backgroundColor: THEME_COLOR }} className="text-white">
        <div className="grid grid-cols-3 items-center h-14 px-4 max-w-full">
          {/* Left: Logo / Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              {clientConfig.logo ? (
                <img
                  src={clientConfig.logo}
                  alt={clientConfig.name}
                  className="w-8 h-8 object-contain"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/20 font-bold text-white">
                  {clientConfig.name.charAt(0)}
                </div>
              )}
              <span className="text-lg font-semibold hidden sm:inline">
                {clientConfig.name}
              </span>
            </Link>
          </div>

          {/* Center: Document Title */}
          <div className="flex justify-center items-center">
            <span className="text-sm font-medium truncate max-w-[160px] sm:max-w-xs opacity-90">
              Untitled Document
            </span>
          </div>

          {/* Right: User Actions */}
          <div className="flex items-center justify-end space-x-1">
            {/* Theme Toggle */}
            <div className="relative group">
              <button
                className="p-2 rounded-lg hover:bg-white/20 transition-colors text-white"
                aria-label="Toggle theme"
              >
                {theme === 'light' && <Sun className="w-4 h-4" />}
                {theme === 'dark' && <Moon className="w-4 h-4" />}
                {theme === 'system' && <Monitor className="w-4 h-4" />}
              </button>
              <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                {themeOptions.map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    onClick={() => setTheme(value)}
                    className={`w-full flex items-center space-x-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg ${
                      theme === value
                        ? 'text-[#ff8635]'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* User Menu */}
            <button
              className="p-2 rounded-lg hover:bg-white/20 transition-colors text-white"
              aria-label="User menu"
            >
              <User className="w-4 h-4" />
            </button>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-white/20 transition-colors text-white"
              onClick={() => toggle('sidebarCollapsed')}
              aria-label="Toggle mobile menu"
            >
              {toggles.sidebarCollapsed ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ===== FLOATING ICONS (desktop md+ only, centred between the two navbars) ===== */}
      <div className="hidden md:flex items-center justify-center absolute left-1/2 -translate-x-1/2 top-14 -translate-y-1/2 z-20">
        <div className="flex items-center gap-0.5 bg-white dark:bg-gray-800 rounded-full shadow-md px-3 py-1.5 border border-gray-200 dark:border-gray-700">
          {actionIcons.map(({ id, icon: Icon, title }) => (
            <button
              key={id}
              onClick={() => openModule(id)}
              className="p-1.5 rounded-full text-gray-600 dark:text-gray-400 hover:text-[#ff8635] hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors"
              title={title}
              aria-label={title}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}

          <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />

          <button
            onClick={() => toggle('editorFullscreen')}
            className="p-1.5 rounded-full text-gray-600 dark:text-gray-400 hover:text-[#ff8635] hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors"
            title="Toggle Fullscreen"
            aria-label="Toggle Fullscreen"
          >
            {toggles.editorFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* ===== NAVBAR 2 ===== */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-3 items-center h-12 px-4 max-w-full">
          {/* Left: View Mode Buttons */}
          <div className="flex items-center">
            <div className="flex items-center space-x-0.5 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {viewModeButtons.map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                    viewMode === mode
                      ? 'bg-white dark:bg-gray-600 text-[#ff8635] shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  aria-label={label}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Center: Action Icons — visible only on mobile (below md) */}
          <div className="md:hidden flex items-center justify-center gap-1">
            {actionIcons.map(({ id, icon: Icon, title }) => (
              <button
                key={id}
                onClick={() => openModule(id)}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-[#ff8635] hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={title}
                aria-label={title}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
            <button
              onClick={() => toggle('editorFullscreen')}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-[#ff8635] hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Toggle Fullscreen"
              aria-label="Toggle Fullscreen"
            >
              {toggles.editorFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Center placeholder on desktop (floating icons handle this space) */}
          <div className="hidden md:block" />

          {/* Right: Document Info */}
          <div className="flex items-center justify-end">
            <div className="text-xs text-gray-500 dark:text-gray-400 text-right hidden sm:flex items-center gap-3">
              <span>Words: {wordCount}</span>
              <span>Chars: {charCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {toggles.sidebarCollapsed && (
        <div
          className="md:hidden border-t border-white/20 text-white"
          style={{ backgroundColor: THEME_COLOR }}
        >
          <div className="px-4 py-3 space-y-1">
            {clientConfig.features.dashboard && (
              <Link
                to="/dashboard"
                className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-white/20 transition-colors"
                onClick={() => toggle('sidebarCollapsed')}
              >
                <span className="text-sm">Dashboard</span>
              </Link>
            )}
            {clientConfig.features.adminDashboard && (
              <Link
                to="/admindashboard"
                className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-white/20 transition-colors"
                onClick={() => toggle('sidebarCollapsed')}
              >
                <span className="text-sm">Admin</span>
              </Link>
            )}
            <Link
              to="/doc-dashboard"
              className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-white/20 transition-colors"
              onClick={() => toggle('sidebarCollapsed')}
            >
              <span className="text-sm">Doc Dashboard</span>
            </Link>
            {clientConfig.features.editor && (
              <Link
                to="/editor"
                className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-white/20 transition-colors"
                onClick={() => toggle('sidebarCollapsed')}
              >
                <span className="text-sm">Editor</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
