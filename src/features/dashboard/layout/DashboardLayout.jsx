import React, { useContext } from 'react';
import { Outlet } from 'react-router-dom';
import DashboardSidebar from './DashboardSidebar';
import DashboardContext from '../context/DashboardContext';
import './DashboardLayout.css';

const DashboardLayout = () => {
  const { dashboardType, sidebarOpen } = useContext(DashboardContext);

  return (
    <div className="dashboard-layout">
      <DashboardSidebar />
      <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="dashboard-header">
          <h1>{dashboardType.charAt(0).toUpperCase() + dashboardType.slice(1)} Dashboard</h1>
        </div>
        <div className="dashboard-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
