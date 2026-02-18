import { useEffect, useState, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { useClient } from '../context/ClientContext';
import { generateMockGridData } from '../utils/clientLoader';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

export default function AdminDashboard() {
  const { clientConfig } = useClient();
  const [rowData, setRowData] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);

  const columnDefs = useMemo(() => [
    {
      headerName: '',
      checkboxSelection: true,
      headerCheckboxSelection: true,
      width: 50,
      pinned: 'left'
    },
    { 
      field: 'id', 
      headerName: 'ID',
      width: 80,
      filter: 'agNumberColumnFilter',
      sortable: true,
      pinned: 'left'
    },
    { 
      field: 'name', 
      headerName: 'Document Name',
      filter: 'agTextColumnFilter',
      sortable: true,
      flex: 2
    },
    { 
      field: 'type', 
      headerName: 'Type',
      filter: 'agSetColumnFilter',
      sortable: true,
      width: 120
    },
    { 
      field: 'status', 
      headerName: 'Status',
      filter: 'agSetColumnFilter',
      sortable: true,
      width: 120,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['Active', 'Inactive', 'Pending', 'Archived']
      },
      cellRenderer: (params) => {
        const colors = {
          'Active': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
          'Inactive': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
          'Pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
          'Archived': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[params.value] || colors.Inactive}`}>
            {params.value}
          </span>
        );
      }
    },
    { 
      field: 'createdDate', 
      headerName: 'Created Date',
      filter: 'agDateColumnFilter',
      sortable: true,
      width: 140
    },
    { 
      field: 'modifiedDate', 
      headerName: 'Last Modified',
      filter: 'agDateColumnFilter',
      sortable: true,
      width: 140
    },
    { 
      field: 'owner', 
      headerName: 'Owner',
      filter: 'agTextColumnFilter',
      sortable: true,
      width: 130
    },
    { 
      field: 'priority', 
      headerName: 'Priority',
      filter: 'agNumberColumnFilter',
      sortable: true,
      width: 100,
      editable: true
    },
    {
      headerName: 'Actions',
      width: 150,
      cellRenderer: () => (
        <div className="flex space-x-1">
          <button className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">
            Edit
          </button>
          <button className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600">
            Delete
          </button>
        </div>
      )
    }
  ], []);

  const defaultColDef = useMemo(() => ({
    resizable: true,
    filter: true,
    sortable: true,
    flex: 1
  }), []);

  useEffect(() => {
    setTimeout(() => {
      setRowData(generateMockGridData(200));
    }, 600);
  }, []);

  const onSelectionChanged = (event) => {
    setSelectedRows(event.api.getSelectedRows());
  };

  if (!clientConfig.features.adminDashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Admin Access Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Admin Dashboard is not enabled for this client configuration.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="flex-1 p-6">
        <div className="max-w-full mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Advanced management and administration tools
            </p>
          </div>

          {/* Admin Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            {[
              { label: 'Total Documents', value: rowData.length, icon: '📄' },
              { label: 'Active Users', value: '24', icon: '👥' },
              { label: 'System Health', value: '98%', icon: '✅' },
              { label: 'Storage Used', value: '45GB', icon: '💾' },
              { label: 'Pending Review', value: '12', icon: '⏳' }
            ].map((stat, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="text-2xl mb-2">{stat.icon}</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Admin Grid */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    All Documents
                  </h2>
                  {selectedRows.length > 0 && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {selectedRows.length} item(s) selected
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    Bulk Approve
                  </button>
                  <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                    Bulk Delete
                  </button>
                  <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                    Create New
                  </button>
                </div>
              </div>
            </div>
            
            <div className="ag-theme-alpine-dark" style={{ height: 600 }}>
              <AgGridReact
                rowData={rowData}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                pagination={true}
                paginationPageSize={25}
                paginationPageSizeSelector={[10, 25, 50, 100, 200]}
                rowSelection="multiple"
                onSelectionChanged={onSelectionChanged}
                suppressRowClickSelection={false}
                rowMultiSelectWithClick={true}
                enableRangeSelection={true}
                enableFillHandle={true}
                undoRedoCellEditing={true}
                undoRedoCellEditingLimit={20}
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
