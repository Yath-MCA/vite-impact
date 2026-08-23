import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, LogOut, UserCircle2 } from 'lucide-react';
import { useAuth } from '../../shared/providers/AuthProvider';
import { useClient } from '../../shared/providers/ClientProvider';

function formatRoleLabel(userRole, isAdmin) {
  if (isAdmin) return 'Admin';
  if (!userRole) return 'User';
  return userRole.charAt(0).toUpperCase() + userRole.slice(1);
}

export default function DashboardTopBar({ title, subtitle }) {
  const { user, userRole, isAdmin, logout } = useAuth();
  const { clientConfig } = useClient();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const profile = useMemo(() => {
    const displayName = user?.username || user?.name || user?.email || 'CMS User';
    const roleLabel = formatRoleLabel(userRole, isAdmin);
    return { displayName, roleLabel };
  }, [isAdmin, user, userRole]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!menuRef.current) return;
      if (menuRef.current.contains(event.target)) return;
      setOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        <div className="mt-1 flex items-center gap-2">
          {clientConfig.logo ? (
            <img src={clientConfig.logo} alt={clientConfig.name} className="h-6 w-auto" loading="lazy" />
          ) : null}
          <span className="text-xs font-semibold uppercase tracking-wider text-primary-700">{clientConfig.name}</span>
        </div>
        {subtitle ? <p className="mt-1 text-sm text-gray-600">{subtitle}</p> : null}
      </div>

      <div ref={menuRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          aria-expanded={open}
          aria-label="Open profile menu"
        >
          <UserCircle2 className="h-5 w-5 text-orange-500" />
          <span className="max-w-[160px] truncate">{profile.displayName}</span>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </button>

        {open ? (
          <div className="absolute right-0 z-30 mt-2 w-56 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
            <div className="rounded-md px-2 py-2">
              <p className="truncate text-sm font-semibold text-gray-900">{profile.displayName}</p>
              <p className="text-xs text-gray-500">{profile.roleLabel}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                logout();
              }}
              className="mt-1 inline-flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
