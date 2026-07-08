import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';

// Global Context Providers
import { AuthProvider } from '../../context/AuthContext';
import { ClientProvider } from '../../context/ClientContext';

// Feature Providers
import { DashboardProvider } from '../../features/dashboard/context/DashboardContext';
import ProtectedRoute from './ProtectedRoute';

// Feature Routes
import DashboardRoutes from '../../features/dashboard/routes/dashboardRoutes';

// Main router configuration
const router = createBrowserRouter([
  {
    path: '/',
    lazy: () => import('../../pages/Landing').then(m => ({ Component: m.default }))
  },
  {
    path: '/login',
    lazy: () => import('../../pages/Login').then(m => ({ Component: m.default }))
  },
  {
    path: '/dashboard/*',
    element: (
      <DashboardProvider>
        <DashboardRoutes />
      </DashboardProvider>
    )
  },
  {
    path: '/doc-dashboard/*',
    element: (
      <DashboardProvider>
        <DashboardRoutes />
      </DashboardProvider>
    )
  },
  {
    path: '/docdashboard',
    element: <Navigate to="/doc-dashboard" replace />
  },
  {
    path: '/doc-finder',
    element: <Navigate to="/devboard" replace />
  },
  {
    path: '/admindashboard',
    element: <Navigate to="/dashboard/admin" replace />
  },

  {
    path: '/client',
    lazy: () => import('../../features/extras/ClientDashboard').then(m => ({ Component: m.default }))
  },
  // {
  //   path: '/reports',
  //   lazy: () => import('../../pages/ReportsPage').then(m => ({ Component: m.default }))
  // },
  // {
  //   path: '/reports/*',
  //   lazy: () => import('../../features/reports').then(m => ({ Component: m.ReportsRoutes }))
  // },
  // {
  //   path: '/settings',
  //   lazy: () => import('../../pages/SettingsPage').then(m => ({ Component: m.default }))
  // },
  // {
  //   path: '/supabase',
  //   lazy: () => import('../../pages/SupabasePage').then(m => ({ Component: m.default }))
  // },
  {
    path: '/validateurl',
    lazy: () => import('../../pages/Landing').then(m => ({ Component: m.default }))
  },
  {
    path: '/validateurl/:client',
    lazy: () => import('../../pages/Landing').then(m => ({ Component: m.default }))
  },
  {
    path: '/editor',
    lazy: () => import('../../features_old/editor/pages/EditorPage').then(m => ({ Component: m.default }))
  },
  {
    path: '/editor-readyonly',
    lazy: async () => {
      const { default: EditorPage } = await import('../../features_old/editor/pages/EditorPage');
      return {
        Component: () => <EditorPage readOnly />
      };
    }
  },
  {
    path: '/config-manager/*',
    lazy: async () => {
      const { default: ConfigManagerPage } = await import('../../components/ConfigManager/ConfigManagerPage');
      return {
        Component: () => (
          <ProtectedRoute requireAdmin>
            <ConfigManagerPage />
          </ProtectedRoute>
        )
      };
    }
  },
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
]);

const AppRouter = () => {
  return (
    <AuthProvider>
      <ClientProvider>
        <RouterProvider router={router} />
      </ClientProvider>
    </AuthProvider>
  );
};

export default AppRouter;
