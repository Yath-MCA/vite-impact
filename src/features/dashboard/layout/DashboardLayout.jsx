
import React, { useContext } from 'react';
import { Outlet } from 'react-router-dom';
import DashboardSidebar from './DashboardSidebar';
import DashboardContext from '../context/DashboardContext';
import './DashboardLayout.css';
import DashboardHeader from './DashboardHeader';
import DocsGrid from '../../doc-finder/DocsGrid';

const DashboardLayout = () => {
  const { dashboardType, sidebarOpen, rowData, fetchLoading } = useContext(DashboardContext);

  return (
    <div className="dashboard-layout">
      <DashboardSidebar />
      
      <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="dashboard-header">
          <h1>{dashboardType.charAt(0).toUpperCase() + dashboardType.slice(1)} Dashboards</h1>
        </div>
        
        <div className="dashboard-content">
          <DashboardHeader />
          <Outlet context={{ rowData, fetchLoading }} />
          <DocsGrid rowData={rowData} />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
