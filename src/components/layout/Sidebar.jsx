import { useState, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useLayout } from '../../context/LayoutContext';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  History,
  Users,
  Settings,
  ChevronRight,
  ChevronLeft,
  Menu,
  BarChart3,
  X
} from 'lucide-react';

const menuConfig = {
  admin: ['Reports', 'Configuration Manager', 'System Logs'],
  developer: ['Package Reports', 'XML Failure', 'Compare', 'Debug Logs']
};

export default function Sidebar() {
  const location = useLocation();
  const { toggles, toggle } = useLayout();
  const { userRole, isAdmin } = useAuth();
  const [expandedSections, setExpandedSections] = useState({ reports: true });

  const isCollapsed = toggles.sidebarCollapsed;

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const navItems = useMemo(() => {
    const items = [
      { path: '/doc-dashboard', label: 'Dashboard', icon: LayoutDashboard },
      {
        path: '/reports',
        label: 'Reports',
        icon: BarChart3,
        children: [
          { path: '/reports/package-failure', label: 'Package / Track-PDF Failure' },
          { path: '/reports/correction-count', label: 'Correction Count' },
          { path: '/reports/save-failure', label: 'Save Failure Items' },
          { path: '/reports/xml-failure', label: 'XML Failure' },
          { path: '/reports/compare', label: 'Compare' }
        ]
      },
      { path: '/history', label: 'Document History', icon: History },
      { path: '/activity', label: 'User Activity', icon: Users },
    ];

    if (isAdmin || userRole === 'admin') {
      items.push({ path: '/config-manager', label: 'Configuration Manager', icon: Settings });
    }

    return items;
  }, [isAdmin, userRole]);

  const renderNavItem = (item) => {
    const Icon = item.icon;
    const hasChildren = item.children?.length > 0;
    const isExpanded = expandedSections[item.path.replace('/', '')] ?? true;
    const active = isActive(item.path);

    return (
      <div key={item.path}>
        <Link
          to={item.path}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            active
              ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          } ${isCollapsed ? 'justify-center' : ''}`}
          onClick={(e) => {
            if (hasChildren) {
              e.preventDefault();
              toggleSection(item.path.replace('/', ''));
            }
          }}
        >
          <Icon className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && (
            <>
              <span className="flex-1 text-sm font-medium">{item.label}</span>
              {hasChildren && (
                <ChevronRight
                  className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                />
              )}
            </>
          )}
        </Link>
        {!isCollapsed && hasChildren && isExpanded && (
          <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
            {item.children.map(child => (
              <Link
                key={child.path}
                to={child.path}
                className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive(child.path)
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {child.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          {!isCollapsed && (
            <span className="font-semibold text-gray-900 dark:text-white">Menu</span>
          )}
          <button
            onClick={() => toggle('sidebarCollapsed')}
            className="p-1.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map(renderNavItem)}
        </nav>

        {!isCollapsed && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <p className="font-medium text-gray-700 dark:text-gray-300">Role Context:</p>
              <p className="mt-1">{isAdmin ? 'Administrator' : userRole || 'User'}</p>
              {(isAdmin ? menuConfig.admin : menuConfig.developer)?.map((item, idx) => (
                <span key={idx} className="inline-block mt-1 mr-2 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px]">
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {toggles.mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => toggle('mobileMenuOpen')}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`md:hidden fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-50 transform transition-transform duration-300 ${
          toggles.mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <span className="font-semibold text-gray-900 dark:text-white">Menu</span>
          <button
            onClick={() => toggle('mobileMenuOpen')}
            className="p-1.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map(renderNavItem)}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <p className="font-medium text-gray-700 dark:text-gray-300">Role Context:</p>
            <p className="mt-1">{isAdmin ? 'Administrator' : userRole || 'User'}</p>
          </div>
        </div>
      </aside>

      {/* Mobile Menu Button */}
      <button
        onClick={() => toggle('mobileMenuOpen')}
        className="md:hidden fixed bottom-4 right-4 p-3 bg-blue-600 text-white rounded-full shadow-lg z-30"
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6" />
      </button>
    </>
  );
}
