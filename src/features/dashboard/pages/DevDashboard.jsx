import React, { useContext } from 'react';
import { useOutletContext } from 'react-router-dom';
import DashboardContext from '../context/DashboardContext';

const DevDashboard = () => {
  // Two ways to access the shared data:
  // 1. From Outlet context (passed by DashboardLayout)
  const { rowData, fetchLoading } = useOutletContext();

  // 2. Or directly from DashboardContext
  // const { rowData, fetchLoading } = useContext(DashboardContext);

  return (
    <div>
      <div className="p-4">
        <p className="text-sm text-gray-500">
          {fetchLoading
            ? 'Fetching data…'
            : `${rowData.length} record(s) loaded`}
        </p>
      </div>
    </div>
  );
};

export default DevDashboard;
