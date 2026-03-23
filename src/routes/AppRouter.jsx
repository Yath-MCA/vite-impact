import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';
import Landing from '../pages/Landing';
import Login from '../pages/Login';

// Dashboard pages - updated to use new feature structure
const Dashboard = lazy(() => import('../features/dashboard/pages/DevDashboard'));
const AdminDashboard = lazy(() => import('../features/dashboard/pages/AdminDashboard'));
const DocDashboard = lazy(() => import('../features/dashboard/pages/DocDashboard'));

const ClientDashboard = lazy(() => import('../pages/ClientDashboard'));
const ReportsPage = lazy(() => import('../pages/ReportsPage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const ValidateUrl = lazy(() => import('../pages/ValidateUrl'));
const DocFinder = lazy(() => import('../pages/DocFinderDashboard'));
const SupabasePage = lazy(() => import('../pages/SupabasePage'));

// Reports module pages
const PackagePdfFailure = lazy(() => import('../modules/reports/PackagePdfFailure'));
const CorrectionCount = lazy(() => import('../modules/reports/CorrectionCount'));
const SaveFailureItems = lazy(() => import('../modules/reports/SaveFailureItems'));
const XmlFailure = lazy(() => import('../modules/reports/XmlFailure'));
const CompareReports = lazy(() => import('../modules/reports/CompareReports'));

// History and Activity modules
const DocumentHistory = lazy(() => import('../modules/history/DocumentHistory'));
const UserActivity = lazy(() => import('../modules/activity/UserActivity'));

// Config Manager module - updated to use new component structure
const ConfigManagerPage = lazy(() => import('../components/ConfigManager/ConfigManagerPage'));

// Editor page
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
    path: '/dashboard/admin',
    element: (
      <Protected requireAdmin>
        <LazyPage>
          <AdminDashboard />
        </LazyPage>
      </Protected>
    )
  },
  {
    path: '/dashboard/dev',
    element: (
      <Protected>
        <LazyPage>
          <Dashboard />
        </LazyPage>
      </Protected>
    )
  },
  {
    path: '/dashboard',
    element: <Navigate to="/dashboard/admin" replace />
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
    path: '/devboard',
    element: (
      <Protected>
        <LazyPage>
          <DocFinder />
        </LazyPage>
      </Protected>
    )
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
    path: '/reports/package-failure',
    element: (
      <Protected>
        <LazyPage>
          <PackagePdfFailure />
        </LazyPage>
      </Protected>
    )
  },
  {
    path: '/reports/correction-count',
    element: (
      <Protected>
        <LazyPage>
          <CorrectionCount />
        </LazyPage>
      </Protected>
    )
  },
  {
    path: '/reports/save-failure',
    element: (
      <Protected>
        <LazyPage>
          <SaveFailureItems />
        </LazyPage>
      </Protected>
    )
  },
  {
    path: '/reports/xml-failure',
    element: (
      <Protected>
        <LazyPage>
          <XmlFailure />
        </LazyPage>
      </Protected>
    )
  },
  {
    path: '/reports/compare',
    element: (
      <Protected>
        <LazyPage>
          <CompareReports />
        </LazyPage>
      </Protected>
    )
  },
  {
    path: '/history',
    element: (
      <Protected>
        <LazyPage>
          <DocumentHistory />
        </LazyPage>
      </Protected>
    )
  },
  {
    path: '/activity',
    element: (
      <Protected>
        <LazyPage>
          <UserActivity />
        </LazyPage>
      </Protected>
    )
  },
  {
    path: '/config-manager',
    element: (
      <Protected requireAdmin>
        <LazyPage>
          <ConfigManagerPage />
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
