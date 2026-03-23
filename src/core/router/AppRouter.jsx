import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Suspense, lazy } from 'react';

// Global Context Providers
import { AuthProvider } from '../../context/AuthContext';
import { ClientProvider } from '../../context/ClientContext';
import { LayoutProvider } from '../../context/LayoutContext';
import { ModuleProvider } from '../../context/ModuleContext';
import { EditorProvider } from '../../context/EditorContext';

// Core Layout
import AppLayout from '../layout/AppLayout';

// Feature Providers
import { DashboardProvider } from '../../features/dashboard/context/DashboardContext';

// Feature Routes
import { DashboardRoutes } from '../../features/dashboard/routes/dashboardRoutes';
import { ReportsRoutes } from '../../features/reports';
import { HistoryRoutes } from '../../features/history';
import { ActivityRoutes } from '../../features/activity';
import { EditorRoutes } from '../../features/editor';

// Lazy loaded pages
const Landing = lazy(() => import('../../pages/Landing'));
const Login = lazy(() => import('../../pages/Login'));
const ClientDashboard = lazy(() => import('../../pages/ClientDashboard'));
const ReportsPage = lazy(() => import('../../pages/ReportsPage'));
const SettingsPage = lazy(() => import('../../pages/SettingsPage'));
const ValidateUrl = lazy(() => import('../../pages/ValidateUrl'));
const DocFinder = lazy(() => import('../../pages/DocFinderDashboard'));
const SupabasePage = lazy(() => import('../../pages/SupabasePage'));

// Config Manager
const ConfigManagerPage = lazy(() => import('../../components/ConfigManager/ConfigManagerPage'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>
);

const LazyPage = ({ children }) => (
  <Suspense fallback={<PageLoader />}>
    {children}
  </Suspense>
);

// Main router configuration
const router = createBrowserRouter([
  {
    path: '/',
    element: <Landing />
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/dashboard',
    element: (
      <DashboardProvider>
        <LazyPage>
          <DashboardRoutes />
        </LazyPage>
      </DashboardProvider>
    )
  },
  {
    path: '/doc-dashboard',
    element: (
      <DashboardProvider>
        <LazyPage>
          <DashboardRoutes />
        </LazyPage>
      </DashboardProvider>
    )
  },
  {
    path: '/devboard',
    element: <Navigate to="/doc-dashboard" replace />
  },
  {
    path: '/doc-finder',
    element: <Navigate to="/devboard" replace />
  },
  {
    path: '/docdashboard',
    element: <Navigate to="/doc-dashboard" replace />
  },
  {
    path: '/doc-dsshbaord',
    element: <Navigate to="/doc-dashboard" replace />
  },
  {
    path: '/admindashboard',
    element: <Navigate to="/dashboard/admin" replace />
  },
  {
    path: '/admin-dashboard',
    element: <Navigate to="/dashboard/admin" replace />
  },
  {
    path: '/admin',
    element: <Navigate to="/dashboard/admin" replace />
  },
  {
    path: '/client',
    element: (
      <LazyPage>
        <ClientDashboard />
      </LazyPage>
    )
  },
  {
    path: '/reports',
    element: (
      <LazyPage>
        <ReportsPage />
      </LazyPage>
    )
  },
  {
    path: '/reports/*',
    element: (
      <LazyPage>
        <ReportsRoutes />
      </LazyPage>
    )
  },
  {
    path: '/settings',
    element: (
      <LazyPage>
        <SettingsPage />
      </LazyPage>
    )
  },
  {
    path: '/supabase',
    element: (
      <LazyPage>
        <SupabasePage />
      </LazyPage>
    )
  },
  {
    path: '/validateurl',
    element: (
      <LazyPage>
        <ValidateUrl />
      </LazyPage>
    )
  },
  {
    path: '/validateurl/:client',
    element: (
      <LazyPage>
        <ValidateUrl />
      </LazyPage>
    )
  },
  {
    path: '/editor/*',
    element: (
      <LazyPage>
        <EditorRoutes />
      </LazyPage>
    )
  },
  {
    path: '/history',
    element: (
      <LazyPage>
        <HistoryRoutes />
      </LazyPage>
    )
  },
  {
    path: '/activity',
    element: (
      <LazyPage>
        <ActivityRoutes />
      </LazyPage>
    )
  },
  {
    path: '/config-manager/*',
    element: (
      <LazyPage>
        <ConfigManagerPage />
      </LazyPage>
    )
  },
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
]);

const AppRouter = () => {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
};

export default AppRouter;
