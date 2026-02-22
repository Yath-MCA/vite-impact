import { useEffect, useState, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { useClient } from '../context/ClientContext';
import { generateMockGridData } from '../utils/clientLoader';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import apiService from '../services/api/apiService';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

export default function Dashboard() {
  const { clientConfig } = useClient();
  const [rowData, setRowData] = useState([]);
  const [allRowData, setAllRowData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [shareIdentifier, setShareIdentifier] = useState('');
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [sendingShare, setSendingShare] = useState(false);
  const [shareResult, setShareResult] = useState(null);

  const columnDefs = useMemo(() => [
    { 
      field: 'id', 
      headerName: 'ID',
      width: 80,
      filter: 'agNumberColumnFilter',
      sortable: true 
    },
    { 
      field: 'name', 
      headerName: 'Name',
      filter: 'agTextColumnFilter',
      sortable: true,
      flex: 2
    },
    { 
      field: 'type', 
      headerName: 'Type',
      filter: 'agTextColumnFilter',
      sortable: true,
      width: 120
    },
    { 
      field: 'status', 
      headerName: 'Status',
      filter: 'agTextColumnFilter',
      sortable: true,
      width: 120,
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
      headerName: 'Created',
      filter: 'agDateColumnFilter',
      sortable: true,
      width: 130
    },
    { 
      field: 'modifiedDate', 
      headerName: 'Modified',
      filter: 'agDateColumnFilter',
      sortable: true,
      width: 130
    },
    { 
      field: 'size', 
      headerName: 'Size',
      filter: 'agTextColumnFilter',
      sortable: true,
      width: 100
    },
    { 
      field: 'owner', 
      headerName: 'Owner',
      filter: 'agTextColumnFilter',
      sortable: true,
      width: 120
    },
    { 
      field: 'priority', 
      headerName: 'Priority',
      filter: 'agNumberColumnFilter',
      sortable: true,
      width: 100,
      cellRenderer: (params) => (
        <div className="flex items-center space-x-1">
          {Array.from({ length: params.value }).map((_, i) => (
            <div 
              key={i} 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: clientConfig.primaryColor }}
            />
          ))}
        </div>
      )
    }
  ], [clientConfig.primaryColor]);

  const defaultColDef = useMemo(() => ({
    resizable: true,
    filter: true,
    sortable: true
  }), []);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const data = generateMockGridData(100);
      setAllRowData(data);
      setRowData(data);
      setLoading(false);
    }, 800);
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchValue(val);

    if (!val) {
      setRowData(allRowData);
      return;
    }

    // Try to compile regex, fallback to literal contains if invalid
    let regex = null;
    try {
      regex = new RegExp(val, 'i');
    } catch (err) {
      regex = null;
    }

    const filtered = allRowData.filter(row => {
      // search across all visible fields
      return Object.values(row).some(v => {
        if (v === null || v === undefined) return false;
        const str = String(v);
        return regex ? regex.test(str) : str.toLowerCase().includes(val.toLowerCase());
      });
    });

    setRowData(filtered);
  };

  if (!clientConfig.features.dashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Dashboard feature is not enabled for this client.
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
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage and view all documents and items
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Items', value: rowData.length, color: 'bg-blue-500' },
              { label: 'Active', value: rowData.filter(r => r.status === 'Active').length, color: 'bg-green-500' },
              { label: 'Pending', value: rowData.filter(r => r.status === 'Pending').length, color: 'bg-yellow-500' },
              { label: 'Archived', value: rowData.filter(r => r.status === 'Archived').length, color: 'bg-red-500' }
            ].map((stat, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-white font-bold text-xl mb-3`}>
                  {stat.value}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Documents
              </h2>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  aria-label="Dashboard search"
                  placeholder="Search (supports regex)"
                  value={searchValue}
                  onChange={handleSearchChange}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              
                <div className="flex space-x-2">
                <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                  Add New
                </button>
                <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  Export
                </button>
                <button
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  onClick={() => setShowSharePanel(prev => !prev)}
                >
                  Share Invite
                </button>
                </div>
              </div>
            {showSharePanel && (
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="flex items-start space-x-3">
                  <input
                    type="text"
                    placeholder="Identifier (e.g. 10.1093/stcltm/szad014)"
                    value={shareIdentifier}
                    onChange={e => setShareIdentifier(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <button
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg"
                    onClick={() => {
                      // find record in allRowData by identifier
                      const id = shareIdentifier.trim();
                      if (!id) return;
                      const found = allRowData.find(r => {
                        const ident = (r.titleinfo && r.titleinfo.identifier) || r.identifier || '';
                        return ident === id;
                      });
                      setSelectedRecord(found || null);
                    }}
                  >
                    Load Record
                  </button>
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                    onClick={async () => {
                      const id = shareIdentifier.trim();
                      if (!id) return;
                      // build payload from selectedRecord or minimal required fields
                      const rec = selectedRecord || allRowData.find(r => ((r.titleinfo && r.titleinfo.identifier) || r.identifier) === id) || {};
                      const payload = {
                        projecttitle: rec.projecttitle || rec.titleinfo?.projectname || rec.projecttitle || rec.title || '',
                        identifier: id,
                        docid: rec.docid || rec.docId || rec.id || '',
                        client: rec.client || 'OUP',
                        dtd: rec.dtd || 'JATS',
                        type: rec.type || 'Journals',
                        sharedcolor: rec.sharedcolor ?? 1,
                        status: rec.status || 'signoff',
                        taskid: rec.taskid || '',
                        fileid: rec.fileid || '',
                        emailtolist: rec.emailtolist || '',
                        emailto: rec.emailto || [],
                        role: rec.role || '',
                        rolename: rec.rolename || '',
                        roletaskid: rec.roletaskid || '',
                        roleabstracttaskid: rec.roleabstracttaskid || '',
                        linkinfo: rec.linkinfo || 'pubkit',
                        order: rec.order || 1,
                        key: rec.key || '',
                        signouttime: rec.signouttime || Date.now()
                      };

                      try {
                        setSendingShare(true);
                        setShareResult(null);
                        const resp = await apiService.shareAndInvite(payload);
                        setShareResult({ success: true, resp });
                      } catch (err) {
                        setShareResult({ success: false, error: err.message || String(err) });
                      } finally {
                        setSendingShare(false);
                      }
                    }}
                    disabled={sendingShare}
                  >
                    {sendingShare ? 'Sending...' : 'Send Share Invite'}
                  </button>
                </div>

                {selectedRecord && (
                  <pre className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded text-xs overflow-auto">{JSON.stringify(selectedRecord, null, 2)}</pre>
                )}

                {shareResult && (
                  <div className={`mt-3 p-3 rounded ${shareResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {shareResult.success ? (
                      <div>Sent successfully: {JSON.stringify(shareResult.resp)}</div>
                    ) : (
                      <div>Error: {shareResult.error}</div>
                    )}
                  </div>
                )}
              </div>
            )}
            </div>
            
            <div className="ag-theme-alpine-dark" style={{ height: 600 }}>
              <AgGridReact
                rowData={rowData}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                pagination={true}
                paginationPageSize={20}
                paginationPageSizeSelector={[10, 20, 50, 100]}
                rowSelection="multiple"
                suppressRowClickSelection={true}
                loadingOverlayComponent={() => (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                )}
                overlayLoadingTemplate="<span class='ag-overlay-loading-center'>Loading data...</span>"
                overlayNoRowsTemplate="<span class='ag-overlay-no-rows-center'>No data available</span>"
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
