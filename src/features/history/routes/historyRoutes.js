import React from 'react';
import { Route } from 'react-router-dom';
import ProtectedRoute from '../../../core/router/ProtectedRoute';
import DocumentHistory from '../pages/DocumentHistory';

const HistoryRoutes = () => {
  return (
    <Route path="/history" element={
      <ProtectedRoute>
        <DocumentHistory />
      </ProtectedRoute>
    } />
  );
};

export default HistoryRoutes;
