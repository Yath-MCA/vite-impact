/**
 * @file useAlertStaging.js
 * @description Custom hook for alert staging system
 * Alerts are staged then dispatched on cache return
 */

import { useRef, useCallback } from 'react';
import { dispatchAlert } from '../../alerts/alertDispatcher';

/**
 * Hook for staging and dispatching alerts
 * @returns {Object} { stageAlert, dispatchAlert: dispatchStaged, pendingAlertRef }
 */
export const useAlertStaging = () => {
  // Use ref to avoid re-renders on stage
  const pendingAlertRef = useRef(null);
  
  /**
   * Stage an alert for later dispatch
   * @param {string} kind - 'toaster' or 'dialog'
   * @param {string} msg - Message key
   * @param {Object} opts - Alert options
   */
  const stageAlert = useCallback((kind, msg, opts = {}) => {
    if (!pendingAlertRef.current) {
      pendingAlertRef.current = { kind, msg, opts };
    }
  }, []);
  
  /**
   * Dispatch the staged alert
   * Clears the pending alert after dispatch
   */
  const dispatchStaged = useCallback(() => {
    if (pendingAlertRef.current) {
      dispatchAlert(pendingAlertRef.current);
      pendingAlertRef.current = null;
    }
  }, []);
  
  /**
   * Get current pending alert without clearing
   * @returns {Object|null}
   */
  const getPendingAlert = useCallback(() => {
    return pendingAlertRef.current;
  }, []);
  
  /**
   * Clear pending alert without dispatching
   */
  const clearPending = useCallback(() => {
    pendingAlertRef.current = null;
  }, []);
  
  return {
    stageAlert,
    dispatchAlert: dispatchStaged,
    pendingAlertRef,
    getPendingAlert,
    clearPending
  };
};

export default useAlertStaging;
