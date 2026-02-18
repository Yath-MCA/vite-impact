/**
 * Example Usage Component for Shareandinvite Grid
 * 
 * Demonstrates how to use the GridWrapper with your MongoDB data
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GridWrapper } from '../grid';
import axios from 'axios';

// Example: Using with client-side data (recommended for <10k rows)
const ShareandinviteGridClientSide = () => {
  const [rowData, setRowData] = useState([]);
  const [loading, setLoading] = useState(true);
  const gridRef = useRef();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Replace with your actual API endpoint
      const response = await axios.get('/api/shareandinvite');
      setRowData(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = useCallback((params) => {
    console.log('Row clicked:', params.data);
  }, []);

  const handleSelectionChanged = useCallback((selectedRows) => {
    console.log('Selected rows:', selectedRows);
  }, []);

  const columnVisibilityConfig = {
    showDocumentInfo: true,
    showWorkflowInfo: true,
    showTaskInfo: true,
    showTimeInfo: true,
    showInternalIds: false,
    showRoleTaskId: false,
    showRoleAbstractTaskId: false,
    showSignOutTime: false
  };

  return (
    <div className="container-fluid py-4">
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Share and Invite Documents</h5>
          <span className="badge bg-primary">{rowData.length} documents</span>
        </div>
        <div className="card-body p-0">
          <GridWrapper
            ref={gridRef}
            rowData={rowData}
            loading={loading}
            columnVisibilityConfig={columnVisibilityConfig}
            onRowClick={handleRowClick}
            onSelectionChanged={handleSelectionChanged}
            height="70vh"
            enableQuickSearch={true}
            enableExport={true}
            paginationPageSize={50}
          />
        </div>
      </div>
    </div>
  );
};

// Example: Using with server-side data (recommended for >10k rows)
const ShareandinviteGridServerSide = () => {
  const gridRef = useRef();

  // Create server-side datasource
  const createServerSideDatasource = useCallback(() => {
    return {
      getRows: async (params) => {
        try {
          console.log('Server request:', params.request);
          
          // Build query parameters from AG-Grid request
          const queryParams = {
            startRow: params.request.startRow,
            endRow: params.request.endRow,
            sortModel: params.request.sortModel,
            filterModel: params.request.filterModel
          };

          // Replace with your actual API endpoint
          const response = await axios.post('/api/shareandinvite/server-side', queryParams);
          
          params.successCallback(
            response.data.rows,
            response.data.lastRow
          );
        } catch (error) {
          console.error('Server-side error:', error);
          params.failCallback();
        }
      }
    };
  }, []);

  const columnVisibilityConfig = {
    showDocumentInfo: true,
    showWorkflowInfo: true,
    showTimeInfo: true,
    showInternalIds: false
  };

  return (
    <div className="container-fluid py-4">
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Share and Invite Documents (Server-Side)</h5>
        </div>
        <div className="card-body p-0">
          <GridWrapper
            ref={gridRef}
            rowData={null}  // Server-side doesn't need initial rowData
            columnVisibilityConfig={columnVisibilityConfig}
            rowModelType="serverSide"
            serverSideDatasource={createServerSideDatasource()}
            height="70vh"
            paginationPageSize={100}
          />
        </div>
      </div>
    </div>
  );
};

// Example: Custom column definitions with custom renderers
const ShareandinviteGridCustom = () => {
  const [rowData, setRowData] = useState([]);
  const gridRef = useRef();

  useEffect(() => {
    // Fetch data...
  }, []);

  // Custom column definitions
  const customColumnDefs = [
    {
      field: 'titleinfo.doctitle',
      headerName: 'Document Title',
      colId: 'doctitle',
      width: 350,
      cellRenderer: (params) => {
        const data = params.data;
        const title = data?.titleinfo?.doctitle || '-';
        const identifier = data?.titleinfo?.identifier || '';
        
        return `
          <div class="d-flex flex-column">
            <span class="fw-bold">${title}</span>
            <small class="text-muted">${identifier}</small>
          </div>
        `;
      }
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      cellRenderer: (params) => {
        const status = params.value;
        const statusColors = {
          'active': 'success',
          'completed': 'info',
          'pending': 'warning',
          'draft': 'secondary'
        };
        const color = statusColors[status?.toLowerCase()] || 'secondary';
        
        return `<span class="badge bg-${color}">${status}</span>`;
      }
    },
    {
      field: 'rolename',
      headerName: 'Current Role',
      width: 150
    },
    {
      field: 'timeiso_u',
      headerName: 'Last Updated',
      width: 180,
      sort: 'desc'
    }
  ];

  return (
    <div className="container-fluid py-4">
      <GridWrapper
        ref={gridRef}
        rowData={rowData}
        columnDefs={customColumnDefs}
        height="70vh"
      />
    </div>
  );
};

// Example: With column visibility toggle UI
const ShareandinviteGridWithToggle = () => {
  const [rowData, setRowData] = useState([]);
  const [visibilityConfig, setVisibilityConfig] = useState({
    showDocumentInfo: true,
    showWorkflowInfo: true,
    showTaskInfo: false,
    showTimeInfo: true,
    showInternalIds: false
  });
  const gridRef = useRef();

  useEffect(() => {
    // Fetch data...
  }, []);

  const toggleGroup = (groupKey) => {
    setVisibilityConfig(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  return (
    <div className="container-fluid py-4">
      {/* Column Visibility Controls */}
      <div className="card mb-3">
        <div className="card-body">
          <h6 className="card-title">Column Visibility</h6>
          <div className="btn-group" role="group">
            <button
              className={`btn btn-sm ${visibilityConfig.showDocumentInfo ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => toggleGroup('showDocumentInfo')}
            >
              Document Info
            </button>
            <button
              className={`btn btn-sm ${visibilityConfig.showWorkflowInfo ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => toggleGroup('showWorkflowInfo')}
            >
              Workflow Info
            </button>
            <button
              className={`btn btn-sm ${visibilityConfig.showTaskInfo ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => toggleGroup('showTaskInfo')}
            >
              Task Info
            </button>
            <button
              className={`btn btn-sm ${visibilityConfig.showTimeInfo ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => toggleGroup('showTimeInfo')}
            >
              Time Info
            </button>
          </div>
        </div>
      </div>

      <GridWrapper
        ref={gridRef}
        rowData={rowData}
        columnVisibilityConfig={visibilityConfig}
        height="65vh"
      />
    </div>
  );
};

export {
  ShareandinviteGridClientSide,
  ShareandinviteGridServerSide,
  ShareandinviteGridCustom,
  ShareandinviteGridWithToggle
};

export default ShareandinviteGridClientSide;
