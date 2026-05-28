import React from 'react';
import { Route } from 'react-router-dom';
import ProtectedRoute from '../../../core/router/ProtectedRoute';
import UserActivity from '../pages/UserActivity';

const ActivityRoutes = () => {
  return (
    <Route path="/activity" element={
      <ProtectedRoute>
        <UserActivity />
      </ProtectedRoute>
    } />
  );
};

export default ActivityRoutes;
