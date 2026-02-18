/**
 * @file EditorAlertContext.jsx
 * @description React Context for dialog state management
 * Provides useAlertContext hook for dialog control
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { alertDispatcherRef } from './alertDispatcher';

// Create context
const EditorAlertContext = createContext(null);

/**
 * Provider component for editor alerts
 * Manages dialog state and populates alertDispatcherRef
 */
export const EditorAlertProvider = ({ children }) => {
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmBtn: 'OK',
    onConfirm: null,
    override: false
  });
  
  /**
   * Show dialog alert
   */
  const showDialog = useCallback((options) => {
    setDialogState({
      isOpen: true,
      title: options.title || 'Warning',
      message: options.message || '',
      confirmBtn: options.confirmBtn || 'OK',
      override: options.override || false,
      onConfirm: options.onConfirm || null
    });
  }, []);
  
  /**
   * Close dialog
   */
  const closeDialog = useCallback(() => {
    setDialogState(prev => ({
      ...prev,
      isOpen: false
    }));
  }, []);
  
  /**
   * Handle confirm button click
   */
  const handleConfirm = useCallback(() => {
    if (dialogState.onConfirm) {
      dialogState.onConfirm();
    }
    closeDialog();
  }, [dialogState.onConfirm, closeDialog]);
  
  // Populate the module-level ref on mount
  useEffect(() => {
    alertDispatcherRef.current = {
      showDialog,
      closeDialog
    };
    
    return () => {
      alertDispatcherRef.current = null;
    };
  }, [showDialog, closeDialog]);
  
  const value = {
    dialogState,
    showDialog,
    closeDialog,
    handleConfirm
  };
  
  return (
    <EditorAlertContext.Provider value={value}>
      {children}
      {/* Dialog Component */}
      {dialogState.isOpen && (
        <DialogAlert
          title={dialogState.title}
          message={dialogState.message}
          confirmBtn={dialogState.confirmBtn}
          onConfirm={handleConfirm}
          onClose={closeDialog}
        />
      )}
    </EditorAlertContext.Provider>
  );
};

/**
 * Hook to access alert context
 * @returns {Object} Alert context value
 */
export const useAlertContext = () => {
  const context = useContext(EditorAlertContext);
  if (!context) {
    throw new Error('useAlertContext must be used within EditorAlertProvider');
  }
  return context;
};

/**
 * Dialog Alert Component
 */
const DialogAlert = ({ title, message, confirmBtn, onConfirm, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {title}
        </h3>
        
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          {message}
        </p>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            {confirmBtn}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditorAlertContext;
