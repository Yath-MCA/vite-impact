import React from 'react';
import { Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../layout/DashboardLayout';
import ProtectedRoute from '../../../core/router/ProtectedRoute';

// Import dashboard pages
import AdminDashboard from '../pages/AdminDashboard';
import DevDashboard from '../pages/DevDashboard';
import DocDashboard from '../pages/DocDashboard';

// Import feature modules
import ConfigManagerPage from '../../../components/ConfigManager/ConfigManagerPage';

import { Routes } from 'react-router-dom';

const DashboardRoutes = () => {
  return (
    <Routes>
      {/* Admin Dashboard Routes */}
      <Route path="/dashboard/admin" element={
        <ProtectedRoute requireAdmin={true}>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index element={<AdminDashboard />} />
      </Route>

      {/* Developer Dashboard Routes */}
      <Route path="/dashboard/dev" element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index element={<DevDashboard />} />
      </Route>

      {/* Document Dashboard Routes */}
      <Route path="/doc-dashboard" element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index element={<DocDashboard />} />
      </Route>

      {/* Configuration Manager Routes */}
      <Route path="/config-manager/*" element={<ConfigManagerPage />} />

      {/* Legacy redirects */}
      <Route path="/admin/dashboard" element={<Navigate to="/dashboard/admin" replace />} />
      <Route path="/dev/dashboard" element={<Navigate to="/dashboard/dev" replace />} />
      <Route path="/dashboard" element={<Navigate to="/dashboard/admin" replace />} />
    </Routes>
  );
};

export default DashboardRoutes;
