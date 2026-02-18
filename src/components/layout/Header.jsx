import { Link, useNavigate } from 'react-router-dom';
import { useClient } from '../../context/ClientContext';
import { useLayout } from '../../context/LayoutContext';
import { Menu, X, Sun, Moon, Monitor, LayoutDashboard, FileText, Settings, User } from 'lucide-react';

export default function Header() {
  const { clientConfig, clientId } = useClient();
  const { toggles, toggle, theme, setTheme } = useLayout();
  const navigate = useNavigate();

  const themeOptions = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' }
  ];

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
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: clientConfig.primaryColor }}
              >
                {clientConfig.name.charAt(0)}
              </div>
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
                    className={`w-full flex items-center space-x-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg ${
                      theme === value ? 'text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'
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
            <button className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <User className="w-5 h-5" />
            </button>

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
