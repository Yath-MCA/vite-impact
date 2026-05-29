import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';


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
import DashboardRoutes from '../../features/dashboard/routes/dashboardRoutes';
// import { ReportsRoutes } from '../../features/reports';
// import { HistoryRoutes } from '../../features/history';
// import { ActivityRoutes } from '../../features/activity';
// import { EditorRoutes } from '../../features/editor';

// Lazy loaded components are now handled using the 'lazy' property in the router config
// to properly integrate with React Router 6.4's transition management.

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>
);

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
  // {
  //   path: '/editor/*',
  //   lazy: () => import('../../features/editor').then(m => ({ Component: m.EditorRoutes }))
  // },
  // {
  //   path: '/history',
  //   lazy: () => import('../../features/history').then(m => ({ Component: m.HistoryRoutes }))
  // },
  // {
  //   path: '/activity',
  //   lazy: () => import('../../features/activity').then(m => ({ Component: m.ActivityRoutes }))
  // },
  {
    path: '/config-manager/*',
    lazy: () => import('../../components/ConfigManager/ConfigManagerPage').then(m => ({ Component: m.default }))
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
