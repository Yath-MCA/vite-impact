import { Navigate, createBrowserRouter } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import MainLayout from '../components/layout/MainLayout';

const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const AdminDashboard = lazy(() => import('../pages/AdminDashboard'));
const ClientDashboard = lazy(() => import('../pages/ClientDashboard'));
const EditorPage = lazy(() => import('../pages/EditorPage'));
const ReportsPage = lazy(() => import('../pages/ReportsPage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));

const PageLoader = () => (
  <div className="flex min-h-full items-center justify-center">
    <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-orange-500" />
  </div>
);

const withSuspense = (node) => <Suspense fallback={<PageLoader />}>{node}</Suspense>;

const appRoutes = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: withSuspense(<DashboardPage />) },
      { path: 'admin', element: withSuspense(<AdminDashboard />) },
      { path: 'client', element: withSuspense(<ClientDashboard />) },
      { path: 'editor', element: withSuspense(<EditorPage />) },
      { path: 'reports', element: withSuspense(<ReportsPage />) },
      { path: 'settings', element: withSuspense(<SettingsPage />) }
    ]
  }
]);

export default appRoutes;
