import { useMemo, useState } from 'react';
import {
  LayoutDashboard,
  FilePenLine,
  FileBarChart2,
  Building2,
  ShieldCheck,
  Settings
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import SidebarItem from './SidebarItem';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Editor', 'Production', 'Author', 'Client'] },
  { to: '/editor', label: 'Editor', icon: FilePenLine, roles: ['Admin', 'Editor', 'Production', 'Author'] },
  { to: '/reports', label: 'Reports', icon: FileBarChart2, roles: ['Admin', 'Editor', 'Production', 'Client'] },
  { to: '/client', label: 'Client Dashboard', icon: Building2, roles: ['Admin', 'Client'] },
  { to: '/admin', label: 'Admin Dashboard', icon: ShieldCheck, roles: ['Admin'] },
  { to: '/settings', label: 'Settings', icon: Settings, roles: ['Admin', 'Editor', 'Production', 'Author', 'Client'] }
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { userRole } = useAuth();
  const normalizedRole = (userRole || 'Editor').toString();

  const items = useMemo(() => {
    return NAV_ITEMS.filter((item) => item.roles.includes(normalizedRole));
  }, [normalizedRole]);

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-64'} border-r border-gray-200 bg-white transition-all duration-200`}>
      <div className="flex items-center justify-between border-b border-gray-200 px-3 py-3">
        {!collapsed && <span className="text-sm font-semibold text-gray-800">CMS Platform</span>}
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
        >
          {collapsed ? '>' : '<'}
        </button>
      </div>
      <nav className="space-y-1 p-2">
        {items.map((item) => (
          <SidebarItem key={item.to} {...item} collapsed={collapsed} />
        ))}
      </nav>
    </aside>
  );
}
