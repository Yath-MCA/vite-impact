import {
  FiHome,
  FiFile,
  FiSettings,
  FiBarChart2,
  FiRefreshCw,
  FiBook,
  FiDatabase,
  FiGitBranch,
  FiShield,
  FiUsers,
  FiActivity,
  FiFolder,
  FiEdit3,
  FiCheckSquare,
  FiTrendingUp,
  FiDownload,
  FiUpload,
  FiCpu,
  FiAlertTriangle
} from 'react-icons/fi';

export const dashboardMenuConfig = {
  admin: [
    {
      id: 'overview',
      label: 'Overview',
      path: '/dashboard/admin',
      icon: FiHome,
      permissions: ['read']
    },
    {
      id: 'documents',
      label: 'Documents',
      path: '/doc-dashboard',
      icon: FiFile,
      permissions: ['read']
    },
    {
      id: 'configuration',
      label: 'Configuration',
      path: '/config-manager',
      icon: FiSettings,
      permissions: ['manage_config'],
      subItems: [
        {
          label: 'Client Configurations',
          path: '/config-manager/clients',
          icon: FiUsers,
          permissions: ['read']
        },
        {
          label: 'Journal Configurations',
          path: '/config-manager/journals',
          icon: FiBook,
          permissions: ['read']
        },
        {
          label: 'XML Editor',
          path: '/config-manager/editor',
          icon: FiEdit3,
          permissions: ['write']
        },
        {
          label: 'Change History',
          path: '/config-manager/history',
          icon: FiRefreshCw,
          permissions: ['read']
        }
      ]
    },
    {
      id: 'reports',
      label: 'Reports',
      path: '/reports',
      icon: FiBarChart2,
      permissions: ['read'],
      subItems: [
        {
          label: 'Activity Report',
          path: '/reports/activity',
          icon: FiActivity,
          permissions: ['read']
        },
        {
          label: 'Performance Report',
          path: '/reports/performance',
          icon: FiTrendingUp,
          permissions: ['read']
        },
        {
          label: 'Error Report',
          path: '/reports/errors',
          icon: FiAlertTriangle,
          permissions: ['read']
        },
        {
          label: 'Usage Statistics',
          path: '/reports/usage',
          icon: FiDatabase,
          permissions: ['read']
        }
      ]
    },
    {
      id: 'history',
      label: 'History',
      path: '/history',
      icon: FiRefreshCw,
      permissions: ['read']
    },
    {
      id: 'users',
      label: 'User Management',
      path: '/admin/users',
      icon: FiUsers,
      permissions: ['manage_users']
    },
    {
      id: 'system',
      label: 'System',
      path: '/admin/system',
      icon: FiCpu,
      permissions: ['manage_config'],
      subItems: [
        {
          label: 'System Status',
          path: '/admin/system/status',
          icon: FiCheckSquare,
          permissions: ['read']
        },
        {
          label: 'Logs',
          path: '/admin/system/logs',
          icon: FiFolder,
          permissions: ['view_logs']
        },
        {
          label: 'Backup & Restore',
          path: '/admin/system/backup',
          icon: FiDownload,
          permissions: ['manage_config']
        }
      ]
    }
  ],

  developer: [
    {
      id: 'overview',
      label: 'Overview',
      path: '/dashboard/dev',
      icon: FiHome,
      permissions: ['read']
    },
    {
      id: 'editor',
      label: 'Editor',
      path: '/editor',
      icon: FiEdit3,
      permissions: ['write']
    },
    {
      id: 'debug',
      label: 'Debug Tools',
      path: '/debug',
      icon: FiCpu,
      permissions: ['debug'],
      subItems: [
        {
          label: 'Package Failure',
          path: '/reports/package-failure',
          icon: FiAlertTriangle,
          permissions: ['read']
        },
        {
          label: 'XML Failure',
          path: '/reports/xml-failure',
          icon: FiAlertTriangle,
          permissions: ['read']
        },
        {
          label: 'Compare Tool',
          path: '/reports/compare',
          icon: FiGitBranch,
          permissions: ['read']
        },
        {
          label: 'Validation Logs',
          path: '/debug/validation',
          icon: FiCheckSquare,
          permissions: ['view_logs']
        }
      ]
    },
    {
      id: 'reports',
      label: 'Reports',
      path: '/reports/dev',
      icon: FiBarChart2,
      permissions: ['read']
    },
    {
      id: 'logs',
      label: 'Logs',
      path: '/debug/logs',
      icon: FiFolder,
      permissions: ['view_logs']
    }
  ],

  document: [
    {
      id: 'overview',
      label: 'Document Dashboard',
      path: '/doc-dashboard',
      icon: FiHome,
      permissions: ['read']
    },
    {
      id: 'my-documents',
      label: 'My Documents',
      path: '/documents/my',
      icon: FiFile,
      permissions: ['read']
    },
    {
      id: 'editor',
      label: 'Document Editor',
      path: '/editor/document',
      icon: FiEdit3,
      permissions: ['write']
    },
    {
      id: 'upload',
      label: 'Upload Documents',
      path: '/documents/upload',
      icon: FiUpload,
      permissions: ['upload']
    },
    {
      id: 'downloads',
      label: 'Downloads',
      path: '/documents/downloads',
      icon: FiDownload,
      permissions: ['download']
    },
    {
      id: 'recent',
      label: 'Recent Activity',
      path: '/documents/recent',
      icon: FiRefreshCw,
      permissions: ['read']
    }
  ]
};

export const getDashboardTypeFromPath = (pathname) => {
  if (pathname.includes('/dashboard/admin')) {
    return 'admin';
  } else if (pathname.includes('/dashboard/dev')) {
    return 'developer';
  } else if (pathname.includes('/doc-dashboard')) {
    return 'document';
  }
  return 'admin'; // default
};

export const getDefaultPathForDashboardType = (dashboardType) => {
  const defaultPaths = {
    admin: '/dashboard/admin',
    developer: '/dashboard/dev',
    document: '/doc-dashboard'
  };
  return defaultPaths[dashboardType] || '/dashboard/admin';
};
