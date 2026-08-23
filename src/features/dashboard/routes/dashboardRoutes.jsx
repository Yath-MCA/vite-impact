import React from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import DashboardLayout from '../layout/DashboardLayout';
import ProtectedRoute from '../../../core/router/ProtectedRoute';
import AdminDashboard from '../pages/AdminDashboard';
import DevDashboard from '../pages/DevDashboard';
import DocDashboard from '../pages/DocDashboard';
import ConfigManagerPage from '../config-manager/ConfigManagerPage';

const ProtectedConfigManager = () => (
  <ProtectedRoute requireAdmin>
    <ConfigManagerPage />
  </ProtectedRoute>
);

const DashboardRoutes = () => {
  const location = useLocation();
  const isDocDashboardBase = location.pathname.startsWith('/doc-dashboard');

  if (isDocDashboardBase) {
    return (
      <Routes>
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DocDashboard />} />
        </Route>
        <Route path="*" element={<Navigate to="/doc-dashboard" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dev" replace />} />
        <Route path="dev" element={<DevDashboard />} />
      </Route>

      <Route
        path="admin"
        element={
          <ProtectedRoute requireAdmin={true}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
      </Route>

      <Route path="config-manager/*" element={<ProtectedConfigManager />} />
      <Route path="admin-dashboard" element={<Navigate to="/admin" replace />} />
      <Route path="dashboard" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default DashboardRoutes;
