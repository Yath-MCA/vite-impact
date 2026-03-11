import React from 'react';
import { Menu, PanelRight } from 'lucide-react';
import { config } from '../../config/permissions';
import { useLayout } from '../../context/LayoutContext';
import SharedMiddleColumn from './SharedMiddleColumn';

export default function Navbar2({ titleParent = "Example Title", titleChild = "Example Subtitle", hideMiddle = false }) {
  const { toggles, toggle } = useLayout();

  const labelParent = config.type === "journal" ? "Journal Title" : "Book Title";
  const labelChild = config.type === "journal" ? "Article Title" : "Chapter";

  const hamburgerCls = (active) =>
    `p-1.5 rounded-md transition-colors ${active
      ? 'text-white'
      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'}`;

  return (
    <div
      className="flex items-center justify-between px-2 sm:px-4 h-10 bg-white border-b border-gray-200 text-sm select-none"
      style={{ fontFamily: "'Inter', 'ui-sans-serif', system-ui" }}
    >
      {/* ── Col 1 Left — TOC Toggle + Parent Title ── */}
      <div className="flex items-center gap-2 w-1/3 min-w-0">
        <button
          onClick={() => toggle('showToc')}
          className={hamburgerCls(toggles.showToc)}
          style={toggles.showToc ? { backgroundColor: '#ff8635' } : {}}
          title="Toggle Table of Contents"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col text-left overflow-hidden min-w-0">
          <span className="text-[10px] uppercase font-semibold tracking-wider leading-none truncate text-gray-400">
            {labelParent}
          </span>
          <span className="text-sm font-medium truncate leading-tight text-gray-800">
            {titleParent}
          </span>
        </div>
      </div>

      {/* ── Col 2 Center — Shared Middle (desktop only, optional) ── */}
      {!hideMiddle && (
        <div className="hidden md:flex justify-center w-1/3">
          <SharedMiddleColumn />
        </div>
      )}
      {hideMiddle && <div className="hidden md:block w-1/3" />}

      {/* ── Col 3 Right — Article Title + Thumbnail Toggle ── */}
      <div className="flex items-center justify-end gap-2 w-1/3 min-w-0">
        <div className="flex-col text-right overflow-hidden min-w-0 mr-1 hidden sm:flex">
          <span className="text-[10px] uppercase font-semibold tracking-wider leading-none truncate text-gray-400">
            {labelChild}
          </span>
          <span className="text-sm font-medium truncate leading-tight text-gray-800">
            {titleChild}
          </span>
        </div>

        <button
          onClick={() => toggle('showThumbnails')}
          className={hamburgerCls(toggles.showThumbnails)}
          style={toggles.showThumbnails ? { backgroundColor: '#ff8635' } : {}}
          title="Toggle Thumbnails"
        >
          <PanelRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
