/**
 * @file AuthContext.jsx
 * @description Authentication context for user/admin roles
 * Manages login state and admin privileges
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiService, ADMIN_CONFIG, ROLE_IDS } from '../services/api/apiService';

const AuthContext = createContext(null);

/**
 * AuthProvider component
 * Manages authentication state globally
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Check if user is admin based on localStorage and user ID
   */
  const checkAdminStatus = useCallback((userData) => {
    const isAdminUser = ADMIN_CONFIG.checkIsAdmin();
    const isSuperAdminUser = userData?.userId ?
      ADMIN_CONFIG.checkIsSuperAdmin(userData.userId) : false;

    setIsAdmin(isAdminUser || isSuperAdminUser);
    setIsSuperAdmin(isSuperAdminUser);
  }, []);

  /**
   * Initialize auth state from localStorage
   */
  useEffect(() => {
    const initAuth = () => {
      try {
        const storedUser = localStorage.getItem('xmleditor:user');
        const storedToken = localStorage.getItem('xmleditor:token');
        if (storedUser && storedToken) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setIsAuthenticated(true);
          setUserRole(userData.role || null);
          checkAdminStatus(userData);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [checkAdminStatus]);

  /**
   * Login user
   */
  const login = useCallback(async (credentials) => {
    setLoading(true);
    setError(null);

    try {
      // Call login API using dedicated method (correct endpoint + headers)
      const response = await apiService.userLogin(
        credentials.email,
        credentials.password
      );

      if (response.data) {

        const userData = response.data;

        if (!response.username) {
          setError('Invalid email');
          return false;
        }
        if (response.cred == 0) {
          setError('Invalid password');
          return false;
        }

        // Store in localStorage
        localStorage.setItem('xmleditor:user', JSON.stringify(userData));
        localStorage.setItem('xmleditor:token', userData.token || '');
        localStorage.setItem('xmleditor:username', userData.username || '');
        localStorage.setItem('xmleditor:userid', userData.userId || '');
        // Check admin status
        if (userData.isAdmin || ADMIN_CONFIG.checkIsSuperAdmin(userData.userId)) {
          localStorage.setItem('xmleditor:admin', 'superadmin');
        }

        // Update state
        setUser(userData);
        setIsAuthenticated(true);
        setUserRole(userData.role || null);
        checkAdminStatus(userData);

        return { success: true, user: userData };
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (err) {
      setError(err.message || 'Login failed');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [checkAdminStatus]);

  /**
   * Logout user
   */
  const logout = useCallback(() => {
    // Clear localStorage
    localStorage.removeItem('xmleditor:user');
    localStorage.removeItem('xmleditor:token');
    localStorage.removeItem('xmleditor:username');
    localStorage.removeItem('xmleditor:userid');
    localStorage.removeItem('xmleditor:admin');

    // Clear state
    setUser(null);
    setIsAuthenticated(false);
    setIsAdmin(false);
    setIsSuperAdmin(false);
    setUserRole(null);
    setError(null);
  }, []);

  /**
   * Update user role
   */
  const updateRole = useCallback((roleId) => {
    setUserRole(roleId);
    if (user) {
      const updatedUser = { ...user, role: roleId };
      setUser(updatedUser);
      localStorage.setItem('xmleditor:user', JSON.stringify(updatedUser));
    }
  }, [user]);

  /**
   * Check if user has specific role
   */
  const hasRole = useCallback((roleId) => {
    return userRole === roleId;
  }, [userRole]);

  /**
   * Get role details
   */
  const getRoleDetails = useCallback(() => {
    return userRole ? ROLE_IDS[userRole] : null;
  }, [userRole]);

  const value = {
    user,
    isAuthenticated,
    isAdmin,
    isSuperAdmin,
    userRole,
    loading,
    error,
    login,
    logout,
    updateRole,
    hasRole,
    getRoleDetails,
    ROLE_IDS
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use auth context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;
