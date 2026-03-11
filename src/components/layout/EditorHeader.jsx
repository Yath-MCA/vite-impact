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

/** Navbar row heights in px */
const NAV1_H = 56; // h-14
const NAV2_H = 48; // h-12

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

  /** Action icons pill — reused in both desktop shared-center and mobile navbar */
  const ActionPill = ({ size = 'md' }) => (
    <div className="flex items-center gap-0.5 bg-white dark:bg-gray-800 rounded-full shadow-md border border-gray-200 dark:border-gray-700 px-3 py-1.5">
      {actionIcons.map(({ id, icon: Icon, title }) => (
        <button
          key={id}
          onClick={() => openModule(id)}
          className={`rounded-full text-gray-600 dark:text-gray-400 hover:text-[#ff8635] hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors ${size === 'sm' ? 'p-1' : 'p-1.5'}`}
          title={title}
          aria-label={title}
        >
          <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        </button>
      ))}
      <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />
      <button
        onClick={() => toggle('editorFullscreen')}
        className={`rounded-full text-gray-600 dark:text-gray-400 hover:text-[#ff8635] hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors ${size === 'sm' ? 'p-1' : 'p-1.5'}`}
        title="Toggle Fullscreen"
        aria-label="Toggle Fullscreen"
      >
        {toggles.editorFullscreen
          ? <Minimize2 className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
          : <Maximize2 className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />}
      </button>
    </div>
  );

  return (
    <header className="sticky top-0 z-50">

      {/* ===================================================================
          DESKTOP (md+): 3-column × 2-row CSS Grid
          The CENTER column spans both rows — one shared component area
          =================================================================== */}
      <div
        className="hidden md:grid grid-cols-3"
        style={{ gridTemplateRows: `${NAV1_H}px ${NAV2_H}px` }}
      >
        {/* ── [row 1, col 1] Brand ── */}
        <div
          style={{ backgroundColor: THEME_COLOR, gridColumn: '1', gridRow: '1' }}
          className="flex items-center px-4 text-white"
        >
          <Link to="/" className="flex items-center space-x-2">
            {clientConfig.logo ? (
              <img
                src={clientConfig.logo}
                alt={clientConfig.name}
                className="w-8 h-8 object-contain"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/20 font-bold">
                {clientConfig.name.charAt(0)}
              </div>
            )}
            <span className="text-lg font-semibold">{clientConfig.name}</span>
          </Link>
        </div>

        {/* ── [row 1–2, col 2] SHARED CENTER — spans both navbar rows ── */}
        {/*
          Explicit gridColumn:'2' is required. Without it, the CSS Grid
          auto-placement algorithm processes items with explicit grid-row
          (Phase 2) before auto-placed items (Phase 3), which would move
          this cell to col 1 and shift the brand to col 2.
        */}
        <div
          style={{ gridColumn: '2', gridRow: '1 / span 2' }}
          className="relative flex items-center justify-center overflow-hidden"
        >
          {/* Top-half background (orange, matches Navbar 1) */}
          <div
            className="absolute top-0 inset-x-0"
            style={{ height: NAV1_H, backgroundColor: THEME_COLOR }}
          />
          {/* Bottom-half background (white/dark, matches Navbar 2) + bottom border */}
          <div
            className="absolute bottom-0 inset-x-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
            style={{ height: NAV2_H }}
          />
          {/* Document title — sits in the upper (orange) half */}
          <div
            className="absolute top-0 inset-x-0 flex items-center justify-center text-white text-sm font-medium opacity-90 z-10 px-2"
            style={{ height: NAV1_H }}
          >
            <span className="truncate">Untitled Document</span>
          </div>
          {/* Action icons pill — naturally centered at the seam between rows */}
          <div className="relative z-20">
            <ActionPill />
          </div>
        </div>

        {/* ── [row 1, col 3] User actions ── */}
        <div
          style={{ backgroundColor: THEME_COLOR, gridColumn: '3', gridRow: '1' }}
          className="flex items-center justify-end px-4 text-white space-x-1"
        >
          {/* Theme Toggle */}
          <div className="relative group">
            <button
              className="p-2 rounded-lg hover:bg-white/20 transition-colors"
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
                    theme === value ? 'text-[#ff8635]' : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
          {/* User */}
          <button
            className="p-2 rounded-lg hover:bg-white/20 transition-colors"
            aria-label="User menu"
          >
            <User className="w-4 h-4" />
          </button>
        </div>

        {/* ── [row 2, col 1] View modes ── */}
        <div
          style={{ gridColumn: '1', gridRow: '2' }}
          className="bg-white dark:bg-gray-800 flex items-center px-4 border-b border-gray-200 dark:border-gray-700"
        >
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
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── [row 2, col 3] Doc info ── */}
        <div
          style={{ gridColumn: '3', gridRow: '2' }}
          className="bg-white dark:bg-gray-800 flex items-center justify-end px-4 border-b border-gray-200 dark:border-gray-700"
        >
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-3">
            <span>Words: {wordCount}</span>
            <span>Chars: {charCount}</span>
          </div>
        </div>
      </div>

      {/* ===================================================================
          MOBILE (<md): Two stacked navbars
          Navbar 2 center column shows action icons inline
          =================================================================== */}
      <div className="md:hidden">
        {/* Navbar 1 */}
        <div style={{ backgroundColor: THEME_COLOR }} className="text-white">
          <div className="grid grid-cols-3 items-center h-14 px-4">
            {/* Left: Brand icon */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                {clientConfig.logo ? (
                  <img
                    src={clientConfig.logo}
                    alt={clientConfig.name}
                    className="w-8 h-8 object-contain"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/20 font-bold">
                    {clientConfig.name.charAt(0)}
                  </div>
                )}
              </Link>
            </div>
            {/* Center: Title */}
            <div className="flex justify-center">
              <span className="text-sm font-medium truncate max-w-[160px] opacity-90">
                Untitled Document
              </span>
            </div>
            {/* Right: User + hamburger */}
            <div className="flex items-center justify-end space-x-1">
              <button
                className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                aria-label="User menu"
              >
                <User className="w-4 h-4" />
              </button>
              <button
                className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                onClick={() => toggle('sidebarCollapsed')}
                aria-label="Toggle mobile menu"
              >
                {toggles.sidebarCollapsed ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Navbar 2 — action icons in CENTER column (visible on mobile only) */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-3 items-center h-12 px-2">
            {/* Left: View modes (icon-only on mobile) */}
            <div className="flex items-center">
              <div className="flex items-center space-x-0.5 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                {viewModeButtons.map(({ mode, icon: Icon, label }) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`flex items-center px-2 py-1 rounded-md text-xs transition-colors ${
                      viewMode === mode
                        ? 'bg-white dark:bg-gray-600 text-[#ff8635] shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                    aria-label={label}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            </div>
            {/* Center: Action icons — shown only on mobile */}
            <div className="flex items-center justify-center gap-0.5">
              <ActionPill size="sm" />
            </div>
            {/* Right: Word count */}
            <div className="flex items-center justify-end">
              <span className="text-xs text-gray-500 dark:text-gray-400">{wordCount}w</span>
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
