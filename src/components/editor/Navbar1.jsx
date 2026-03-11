import React, { useState, useRef, useEffect } from 'react';
import {
  FileText, FileCheck, FileSignature,
  LayoutPanelLeft, FileBarChart2, LayoutGrid, Maximize2,
  User, LogOut, ShieldCheck,
  HelpCircle, BookOpen, PlayCircle, Phone,
  Save, Share2, Eye, History, Wifi, WifiOff, CheckCircle,
  Map, ChevronDown
} from 'lucide-react';
import { hasPermission } from '../../config/permissions';
import { config } from '../../config/permissions';
import SharedMiddleColumn from './SharedMiddleColumn';

// ─── Dropdown hook ────────────────────────────────────────────────────────────
function useDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  return { open, setOpen, ref };
}

// ─── Dropdown wrapper ─────────────────────────────────────────────────────────
function Dropdown({ trigger, children, align = 'left' }) {
  const { open, setOpen, ref } = useDropdown();
  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen(o => !o)}>{trigger(open)}</div>
      {open && (
        <div
          className={`absolute top-full mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-xl py-1 min-w-[192px] ${align === 'right' ? 'right-0' : 'left-0'}`}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon: Icon, label, onClick, danger = false }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-orange-50 ${danger ? 'text-red-500 hover:text-red-600' : 'text-gray-700 hover:text-gray-900'}`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span>{label}</span>
    </button>
  );
}

function Divider() {
  return <div className="my-1 h-px bg-gray-100" />;
}

// ─── View Options Dropdown ────────────────────────────────────────────────────
function ViewOptionsDropdown() {
  return (
    <Dropdown
      trigger={(open) => (
        <button
          id="navbar-view-options"
          data-id="navbar-view-options"
          title="View Option"
          className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-sm font-medium transition-colors border ${open ? 'bg-orange-50 border-orange-300 text-orange-600' : 'border-transparent text-gray-600 hover:bg-orange-100'}`}
        >
          <LayoutGrid className="w-4 h-4" />
        </button>
      )}
    >
      <div className="px-3 py-1.5">
        <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Layout</p>
      </div>
      <MenuItem icon={LayoutPanelLeft} label="Editor Only View" />
      <MenuItem icon={FileBarChart2} label="Proof Only View" />
      <MenuItem icon={LayoutGrid} label="Combined View (Sync Scroll)" />
      <MenuItem icon={Maximize2} label="Maximize Editor" />
    </Dropdown>
  );
}

// ─── Profile Dropdown ─────────────────────────────────────────────────────────
function ProfileDropdown() {
  const name = "Jane Smith";
  const role = config.userRole.charAt(0).toUpperCase() + config.userRole.slice(1);
  return (
    <Dropdown
      align="right"
      trigger={(open) => (
        <button
          id="navbar-profile"
          data-id="navbar-profile"
          title="Profile"
          className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-sm font-medium transition-colors border ${open ? 'bg-orange-50 border-orange-300 text-orange-600' : 'border-transparent text-gray-600 hover:bg-orange-100'}`}
        >
          <User className="w-4 h-4" />
          <ChevronDown className="w-3 h-3" />
        </button>
      )}
    >
      <MenuItem icon={User} label={name} />
      <MenuItem icon={ShieldCheck} label={role} />
      <Divider />
      <MenuItem icon={LogOut} label="Logout" danger />
    </Dropdown>
  );
}

// ─── Help Dropdown ────────────────────────────────────────────────────────────
function HelpDropdown() {
  return (
    <Dropdown
      align="right"
      trigger={(open) => (
        <button
          id="navbar-help"
          data-id="navbar-help"
          title="Help"
          className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-sm font-medium transition-colors border ${open ? 'bg-orange-50 border-orange-300 text-orange-600' : 'border-transparent text-gray-600 hover:bg-orange-100'}`}
        >
          <HelpCircle className="w-4 h-4" />
          <span className="hidden lg:inline">Help</span>
          <ChevronDown className="w-3 h-3 hidden lg:block" />
        </button>
      )}
    >
      <div className="px-3 py-1.5">
        <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Support</p>
      </div>
      <MenuItem icon={HelpCircle} label="FAQ" />
      <MenuItem icon={BookOpen} label="User Guide" />
      <MenuItem icon={PlayCircle} label="Video Tutorial" />
      <MenuItem icon={Phone} label="Contact Support" />
    </Dropdown>
  );
}

// ─── Navbar1 ──────────────────────────────────────────────────────────────────
export default function Navbar1() {
  const permProofPDF = hasPermission('proofPDF');
  const permCETrack = hasPermission('ceTrack');
  const permGenerateTrack = hasPermission('generateTrack');
  const permFinalize = hasPermission('finalize');

  const pdfBtn = (hasPerm, icon, label) => {
    const base = "flex items-center gap-1 px-2 py-1.5 rounded-md text-sm font-medium transition-colors hover:bg-orange-100";
    return hasPerm
      ? `${base} text-gray-600`
      : `${base} opacity-30 pointer-events-none text-gray-400`;
  };

  return (
    <div
      id="navbar-main"
      data-id="navbar-main"
      className="relative flex items-center justify-between px-2 sm:px-4 h-12 md:h-14 bg-white border-b border-gray-200 text-sm select-none"
      style={{ fontFamily: "'Inter', 'ui-sans-serif', system-ui" }}
    >
      {/* ── Col 1 Left — PDF Action Buttons ── */}
      <div id="navbar-left" data-id="navbar-left" className="flex items-center gap-1 z-10">
        <button id="navbar-btn-proof-pdf" data-id="navbar-btn-proof-pdf" className={pdfBtn(permProofPDF, FileText, 'Proof PDF')} title="Proof PDF">
          <FileText className="w-4 h-4" />
          <span className="hidden lg:inline">Proof PDF</span>
        </button>
        <button id="navbar-btn-ce-track" data-id="navbar-btn-ce-track" className={pdfBtn(permCETrack, FileCheck, 'CE Track PDF')} title="CE Track PDF">
          <FileCheck className="w-4 h-4" />
          <span className="hidden lg:inline">CE Track</span>
        </button>
        <button id="navbar-btn-generate-track" data-id="navbar-btn-generate-track" className={pdfBtn(permGenerateTrack, FileSignature, 'Generate Track PDF')} title="Generate Track PDF">
          <FileSignature className="w-4 h-4" />
          <span className="hidden lg:inline">Generate Track</span>
        </button>
      </div>

      {/* ── Col 2 Center — Shared Middle ── */}
      <div id="navbar-center" data-id="navbar-center" className="hidden md:flex absolute left-1/2 transform -translate-x-1/2">
        <SharedMiddleColumn />
      </div>

      {/* ── Col 3 Right — Utility Controls ── */}
      <div id="navbar-right" data-id="navbar-right" className="flex items-center gap-1 z-10">
        {/* Guided Tour */}
        <button
          id="navbar-btn-tour"
          data-id="navbar-btn-tour"
          title="Guided Tour"
          className="flex items-center gap-1 px-2 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:bg-orange-100 transition-colors"
        >
          <Map className="w-4 h-4" />
          <span className="hidden lg:inline">Tour</span>
        </button>

        <div className="w-px h-5 bg-gray-200 mx-0.5" />

        {/* View Options */}
        <ViewOptionsDropdown />

        <div className="w-px h-5 bg-gray-200 mx-0.5" />

        {/* Help */}
        <HelpDropdown />

        {/* Profile */}
        <ProfileDropdown />

        <div className="w-px h-5 bg-gray-200 mx-0.5" />

        {/* Finalize */}
        <button
          id="navbar-btn-finalize"
          data-id="navbar-btn-finalize"
          className={
            permFinalize
              ? "flex items-center gap-1 px-2 py-1.5 rounded-md text-sm font-medium bg-green-600 hover:bg-green-700 text-white transition-colors"
              : "flex items-center gap-1 px-2 py-1.5 rounded-md text-sm font-medium opacity-30 pointer-events-none text-gray-400"
          }
          title="Finalize"
        >
          <CheckCircle className="w-4 h-4" />
          <span className="hidden lg:inline">Finalize</span>
        </button>
      </div>
    </div>
  );
}
