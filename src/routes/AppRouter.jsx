import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Landing from '../pages/Landing';
import Dashboard from '../pages/Dashboard';
import AdminDashboard from '../pages/AdminDashboard';
import ValidateUrl from '../pages/ValidateUrl';

const EditorPage = lazy(() => import('../pages/EditorPage'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <Landing />
  },
  {
    path: '/dashboard',
    element: <Dashboard />
  },
  {
    path: '/admindashboard',
    element: <AdminDashboard />
  },
  {
    path: '/validateurl/:client',
    element: <ValidateUrl />
  },
  {
    path: '/editor',
    element: (
      <Suspense fallback={<PageLoader />}>
        <EditorPage />
      </Suspense>
    )
  },
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
