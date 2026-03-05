import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';
import Landing from '../pages/Landing';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import AdminDashboard from '../pages/AdminDashboard';
import ValidateUrl from '../pages/ValidateUrl';
import DocDashboard from '../pages/DocDashboard';
import SupabasePage from '../pages/SupabasePage';

const EditorPage = lazy(() => import('../pages/EditorPage'));

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
        <Dashboard />
      </Protected>
    )
  },
  {
    path: '/doc-dashboard',
    element: (
      <Protected>
        <DocDashboard />
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
        <AdminDashboard />
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
    path: '/supabase',
    element: <SupabasePage />
  },
  {
    path: '/validateurl',
    element: <ValidateUrl />
  },
  {
    path: '/validateurl/:client',
    element: <ValidateUrl />
  },
  {
    path: '/editor',
    element: (
      <Protected>
        <Suspense fallback={<PageLoader />}>
          <EditorPage />
        </Suspense>
      </Protected>
    )
  },
  {
    path: '/editor-readyonly',
    element: (
      <Protected>
        <Suspense fallback={<PageLoader />}>
          <EditorPage readOnly />
        </Suspense>
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
