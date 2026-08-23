import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';

import { AuthProvider } from '../../shared/providers/AuthProvider';
import { ClientProvider } from '../../shared/providers/ClientProvider';
import { EditorProvider } from '../../context/EditorContext';
import { LayoutProvider } from '../../context/LayoutContext';
import { ModuleProvider } from '../../context/ModuleContext';

import { DashboardProvider } from '../../features/dashboard/context/DashboardContext';
import ProtectedRoute from './ProtectedRoute';
import DashboardRoutes from '../../features/dashboard/routes/dashboardRoutes';
import BrowserCompatibilityGate from './BrowserCompatibilityGate';

function withEditorProviders(Component, readOnly = false) {
  return function EditorRoute() {
    return (
      <EditorProvider>
        <LayoutProvider>
          <ModuleProvider>
            <Component readOnly={readOnly} />
          </ModuleProvider>
        </LayoutProvider>
      </EditorProvider>
    );
  };
}

const router = createBrowserRouter([
  {
    path: '/',
    lazy: () => import('../../features/landing/pages/ValidateUrlPage').then(m => ({ Component: m.default }))
  },
  {
    path: '/login',
    lazy: () => import('../../features/auth/pages/Login').then(m => ({ Component: m.default }))
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
    lazy: () =>
      import('../../features/editor/pages/EditorPage').then((m) => ({
        Component: withEditorProviders(m.default, false)
      }))
  },
  {
    path: '/editor-readyonly',
    lazy: () =>
      import('../../features/editor/pages/EditorPage').then((m) => ({
        Component: withEditorProviders(m.default, true)
      }))
  },
  {
    path: '/config-manager/*',
    lazy: async () => {
      const { default: ConfigManagerPage } = await import('../../features/config-manager/ConfigManagerPage');
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
