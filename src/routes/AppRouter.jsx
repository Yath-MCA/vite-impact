import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';
import Landing from '../pages/Landing';
import Login from '../pages/Login';

const EditorPage = lazy(() => import('../pages/EditorPage'));
const Dashboard = lazy(() => import('../pages/DashboardPage'));
const AdminDashboard = lazy(() => import('../pages/AdminDashboard'));
const ClientDashboard = lazy(() => import('../pages/ClientDashboard'));
const ReportsPage = lazy(() => import('../pages/ReportsPage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const ValidateUrl = lazy(() => import('../pages/ValidateUrl'));
const DocDashboard = lazy(() => import('../pages/DocDashboard'));
const SupabasePage = lazy(() => import('../pages/SupabasePage'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>
);

// Wrap component with ProtectedRoute
const Protected = ({ children, requireAdmin = false }) => (
  <ProtectedRoute requireAdmin={requireAdmin}>
    {children}
  </ProtectedRoute>
);

const LazyPage = ({ children }) => (
  <Suspense fallback={<PageLoader />}>
    {children}
  </Suspense>
);

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
      <Protected>
        <LazyPage>
          <Dashboard />
        </LazyPage>
      </Protected>
    )
  },
  {
    path: '/doc-dashboard',
    element: (
      <Protected>
        <LazyPage>
          <DocDashboard />
        </LazyPage>
      </Protected>
    )
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
    element: (
      <Protected requireAdmin>
        <LazyPage>
          <AdminDashboard />
        </LazyPage>
      </Protected>
    )
  },
  {
    path: '/admin-dashboard',
    element: <Navigate to="/admindashboard" replace />
  },
  {
    path: '/admin',
    element: <Navigate to="/admindashboard" replace />
  },
  {
    path: '/client',
    element: (
      <Protected>
        <LazyPage>
          <ClientDashboard />
        </LazyPage>
      </Protected>
    )
  },
  {
    path: '/reports',
    element: (
      <Protected>
        <LazyPage>
          <ReportsPage />
        </LazyPage>
      </Protected>
    )
  },
  {
    path: '/settings',
    element: (
      <Protected>
        <LazyPage>
          <SettingsPage />
        </LazyPage>
      </Protected>
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
    path: '/editor',
    element: (
      <Protected>
        <LazyPage>
          <EditorPage />
        </LazyPage>
      </Protected>
    )
  },
  {
    path: '/editor-readyonly',
    element: (
      <Protected>
        <LazyPage>
          <EditorPage readOnly />
        </LazyPage>
      </Protected>
    )
  },
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
]);

export default function AppRouter() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
