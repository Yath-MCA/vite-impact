import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';

import { AuthProvider } from '../../shared/providers/AuthProvider';
import { ClientProvider } from '../../shared/providers/ClientProvider';
import ProtectedRoute from './ProtectedRoute';
import BrowserCompatibilityGate from './BrowserCompatibilityGate';

async function loadDashboardRoute() {
  const [{ DashboardProvider }, { default: DashboardRoutes }] = await Promise.all([
    import('../../features/dashboard/context/DashboardContext'),
    import('../../features/dashboard/routes/dashboardRoutes')
  ]);

  return {
    Component: function DashboardRoute() {
      return (
        <DashboardProvider>
          <DashboardRoutes />
        </DashboardProvider>
      );
    }
  };
}

async function loadEditorRoute(readOnly) {
  const [{ createEditorRoute }, { default: EditorPage }] = await Promise.all([
    import('../../features/editor/routes/EditorRouteShell'),
    import('../../features/editor/pages/EditorPage')
  ]);

  return { Component: createEditorRoute(EditorPage, readOnly) };
}

const router = createBrowserRouter([
  {
    path: '/',
    lazy: () => import('../../features/landing/pages/MarketingLandingPage').then(m => ({ Component: m.default }))
  },
  {
    path: '/login',
    lazy: () => import('../../features/auth/pages/Login').then(m => ({ Component: m.default }))
  },
  {
    path: '/dashboard/*',
    lazy: loadDashboardRoute
  },
  {
    path: '/doc-dashboard/*',
    lazy: loadDashboardRoute
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
    lazy: () => import('../../features/dashboard/pages/ClientDashboard').then(m => ({ Component: m.default }))
  },
  {
    path: '/validateurl',
    lazy: () => import('../../features/landing/pages/ValidateUrlPage').then(m => ({ Component: m.default }))
  },
  {
    path: '/validateurl/:client',
    lazy: () => import('../../features/landing/pages/ValidateUrlPage').then(m => ({ Component: m.default }))
  },
  {
    path: '/editor',
    lazy: () => loadEditorRoute(false)
  },
  {
    path: '/editor-readyonly',
    lazy: () => loadEditorRoute(true)
  },
  {
    path: '/config-manager/*',
    lazy: async () => {
      const { default: ConfigManagerPage } = await import('../../features/dashboard/config-manager/ConfigManagerPage');
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
        <BrowserCompatibilityGate>
          <RouterProvider router={router} />
        </BrowserCompatibilityGate>
      </ClientProvider>
    </AuthProvider>
  );
};

export default AppRouter;
