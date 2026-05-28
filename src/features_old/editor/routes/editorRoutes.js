import React from 'react';
import { Route } from 'react-router-dom';
import ProtectedRoute from '../../../core/router/ProtectedRoute';
import EditorPage from '../pages/EditorPage';

const EditorRoutes = () => {
  return (
    <>
      <Route path="/editor" element={
        <ProtectedRoute>
          <EditorPage />
        </ProtectedRoute>
      } />
      <Route path="/editor-readyonly" element={
        <ProtectedRoute>
          <EditorPage readOnly />
        </ProtectedRoute>
      } />
    </>
  );
};

export default EditorRoutes;
