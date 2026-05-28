import React from 'react';
import { Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../../../core/router/ProtectedRoute';

// Import report pages
import CompareReports from '../pages/CompareReports';
import CorrectionCount from '../pages/CorrectionCount';
import PackagePdfFailure from '../pages/PackagePdfFailure';
import SaveFailureItems from '../pages/SaveFailureItems';
import XmlFailure from '../pages/XmlFailure';

const ReportsRoutes = () => {
  return (
    <>
      <Route path="/reports" element={<Navigate to="/reports/package-failure" replace />} />
      
      <Route path="/reports/package-failure" element={
        <ProtectedRoute>
          <PackagePdfFailure />
        </ProtectedRoute>
      } />
      
      <Route path="/reports/correction-count" element={
        <ProtectedRoute>
          <CorrectionCount />
        </ProtectedRoute>
      } />
      
      <Route path="/reports/save-failure" element={
        <ProtectedRoute>
          <SaveFailureItems />
        </ProtectedRoute>
      } />
      
      <Route path="/reports/xml-failure" element={
        <ProtectedRoute>
          <XmlFailure />
        </ProtectedRoute>
      } />
      
      <Route path="/reports/compare" element={
        <ProtectedRoute>
          <CompareReports />
        </ProtectedRoute>
      } />
    </>
  );
};

export default ReportsRoutes;
