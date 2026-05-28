// Dashboard Feature Module
// This file exports all dashboard-related components and utilities

// Layout Components
export { default as DashboardLayout } from './layout/DashboardLayout';
export { default as DashboardSidebar } from './layout/DashboardSidebar';

// Pages
export { default as AdminDashboard } from './pages/AdminDashboard';
export { default as DevDashboard } from './pages/DevDashboard';
export { default as DocDashboard } from './pages/DocDashboard';

// Components
export { default as StatsCards } from './components/StatsCards';
export { default as ActivityChart } from './components/ActivityChart';
export { default as QueryChart } from './components/QueryChart';
export { default as RecentDocumentsGrid } from './components/RecentDocumentsGrid';
export { default as Notifications } from './components/Notifications';

// Context
export { DashboardProvider, useDashboard } from './context/DashboardContext';
export { default as DashboardContext } from './context/DashboardContext';

// Configuration
export { 
  dashboardMenuConfig, 
  getDashboardTypeFromPath, 
  getDefaultPathForDashboardType 
} from './config/dashboardMenuConfig';

// Routes
export { default as DashboardRoutes } from './routes/dashboardRoutes';

// Hooks
export { default as useDashboard } from './hooks/useDashboard';
