import React, { useState } from 'react';
import { Share2, Save, Eye, History, Wifi, WifiOff } from 'lucide-react';

const ACCENT = '#ff8635';

export default function SharedMiddleColumn({ className = '' }) {
  const [isOnline, setIsOnline] = useState(true);

  return (
    <div id="navbar-center-container" data-id="navbar-center-container" className={`flex items-center gap-1 md:gap-1.5 ${className}`}>
      {/* Share & Invite — outline */}
      <button
        id="navbar-btn-share-invite"
        data-id="navbar-btn-share-invite"
        className="flex items-center gap-1.5 px-2.5 py-1.5 md:px-3 md:py-2 rounded-md text-sm md:text-base font-medium border border-gray-300 text-gray-700 hover:border-orange-400 hover:text-orange-500 hover:bg-orange-50 transition-colors"
        style={{ '--tw-ring-color': ACCENT }}
        title="Share & Invite"
      >
        <Share2 className="w-4 h-4 md:w-5 md:h-5" />
      </button>

      <div className="w-px h-5 md:h-6 bg-gray-200" />

      {/* Save — primary orange */}
      <button
        id="navbar-btn-save"
        data-id="navbar-btn-save"
        className="flex items-center gap-1.5 px-2.5 py-1.5 md:px-3 md:py-2 rounded-md text-sm md:text-base font-semibold text-white transition-colors hover:bg-orange-400"
        style={{ backgroundColor: ACCENT }}
        title="Save"
      >
        <Save className="w-4 h-4 md:w-5 md:h-5" />
      </button>

      {/* View Options — ghost */}
      {/* <button
        id="navbar-btn-view"
        data-id="navbar-btn-view"
        className="flex items-center gap-1.5 px-2.5 py-1.5 md:px-3 md:py-2 rounded-md text-sm md:text-base font-medium text-gray-600 hover:bg-orange-50 transition-colors"
        title="View Options"
      >
        <Eye className="w-4 h-4 md:w-5 md:h-5" />
      </button> */}

      <div className="w-px h-5 md:h-6 bg-gray-200" />

      {/* Show Revisions — ghost */}
      <button
        id="navbar-btn-revisions"
        data-id="navbar-btn-revisions"
        className="flex items-center gap-1.5 px-2.5 py-1.5 md:px-3 md:py-2 rounded-md text-sm md:text-base font-medium text-gray-600 hover:bg-orange-50 transition-colors"
        title="Show Revisions"
      >
        <History className="w-4 h-4 md:w-5 md:h-5" />
      </button>

      <div className="w-px h-5 md:h-6 bg-gray-200" />

      {/* Online / Offline toggle */}
      <button
        id="navbar-btn-online-status"
        data-id="navbar-btn-online-status"
        onClick={() => setIsOnline(v => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 md:px-3 md:py-2 rounded-md text-sm md:text-base font-medium border transition-colors hover:bg-orange-50"
        style={
          isOnline
            ? { borderColor: '#22c55e', color: '#16a34a' }
            : { borderColor: '#d1d5db', color: '#9ca3af' }
        }
        title={isOnline ? 'Online' : 'Offline'}
      >
        <span className="relative flex h-2 w-2">
          {isOnline && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
        </span>
        {isOnline ? <Wifi className="w-4 h-4 md:w-5 md:h-5" /> : <WifiOff className="w-4 h-4 md:w-5 md:h-5" />}
      </button>
    </div>
  );
}
