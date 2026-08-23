import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useClient } from '../../shared/providers/ClientProvider';
import { useLayout } from '../../context/LayoutContext';
import { useAuth } from '../../shared/providers/AuthProvider';
import { Menu, X, Sun, Moon, Monitor, LayoutDashboard, FileText, Settings, User, Database } from 'lucide-react';

export default function Header() {
  const { clientConfig, clientId } = useClient();
  const { toggles, toggle, theme, setTheme } = useLayout();
  const { user, userRole, isAdmin, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const themeOptions = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' }
  ];

  const profile = useMemo(() => {
    const displayName = user?.username || user?.name || user?.email || 'CMS User';
    const roleLabel = isAdmin
      ? 'Admin'
      : userRole
        ? userRole.charAt(0).toUpperCase() + userRole.slice(1)
        : 'User';
    return { displayName, roleLabel };
  }, [isAdmin, user, userRole]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!profileRef.current) return;
      if (profileRef.current.contains(event.target)) return;
      setProfileOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  if (!clientConfig.layout.showHeader && toggles.showHeader === false) {
    return null;
  }

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              {clientConfig.logo ? (
                <img
                  src={clientConfig.logo}
                  alt={clientConfig.name}
                  className="h-8 w-auto object-contain"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: clientConfig.primaryColor }}
                >
                  {clientConfig.name.charAt(0)}
                </div>
              )}
              <span className="text-xl font-semibold text-gray-900 dark:text-white">
                {clientConfig.name}
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {clientConfig.features.dashboard && (
              <Link
                to="/dashboard"
                className="flex items-center space-x-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
            )}

            {clientConfig.features.adminDashboard && (
              <Link
                to="/admindashboard"
                className="flex items-center space-x-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Admin</span>
              </Link>
            )}

            <Link
              to="/doc-dashboard"
              className="flex items-center space-x-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <Database className="w-4 h-4" />
              <span>Doc Dashboard</span>
            </Link>

            <Link
              to="/devboard"
              className="flex items-center space-x-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Devboard</span>
            </Link>

            {clientConfig.features.editor && (
              <Link
                to="/editor"
                className="flex items-center space-x-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span>Editor</span>
              </Link>
            )}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <div className="relative group">
              <button className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                {theme === 'light' && <Sun className="w-5 h-5" />}
                {theme === 'dark' && <Moon className="w-5 h-5" />}
                {theme === 'system' && <Monitor className="w-5 h-5" />}
              </button>

              <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                {themeOptions.map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    onClick={() => setTheme(value)}
                    className={`w-full flex items-center space-x-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg ${theme === value ? 'text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Client Badge */}
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: clientConfig.primaryColor }}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {clientId}
              </span>
            </div>

            {/* User Menu */}
            <div ref={profileRef} className="relative">
              <button
                className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                onClick={() => setProfileOpen((prev) => !prev)}
                aria-label="Open profile menu"
                aria-expanded={profileOpen}
              >
                <User className="w-5 h-5" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                  <div className="rounded-md px-2 py-2">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{profile.displayName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{profile.roleLabel}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      logout();
                    }}
                    className="mt-1 w-full rounded-md px-2 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={() => toggle('sidebarCollapsed')}
            >
              {toggles.sidebarCollapsed ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {toggles.sidebarCollapsed && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="px-4 py-3 space-y-2">
            {clientConfig.features.dashboard && (
              <Link
                to="/dashboard"
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => toggle('sidebarCollapsed')}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
            )}
            {clientConfig.features.adminDashboard && (
              <Link
                to="/admindashboard"
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => toggle('sidebarCollapsed')}
              >
                <Settings className="w-4 h-4" />
                <span>Admin</span>
              </Link>
            )}
            <Link
              to="/doc-dashboard"
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => toggle('sidebarCollapsed')}
            >
              <Database className="w-4 h-4" />
              <span>Doc Dashboard</span>
            </Link>

            <Link
              to="/devboard"
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => toggle('sidebarCollapsed')}
            >
              <FileText className="w-4 h-4" />
              <span>Devboard</span>
            </Link>
            {clientConfig.features.editor && (
              <Link
                to="/editor"
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => toggle('sidebarCollapsed')}
              >
                <FileText className="w-4 h-4" />
                <span>Editor</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
