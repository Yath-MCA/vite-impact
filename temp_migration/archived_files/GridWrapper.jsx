import React, { useMemo, useCallback, useRef, useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { getDefaultGridOptions } from './gridOptions';
import { 
  getAllColumnDefs, 
  updateColumnVisibility,
  getDefaultColumnDefs 
} from './columnDefs';
import { getColumnVisibility, mergeColumnVisibilityConfig } from './columnVisibilityConfig';
import PropTypes from 'prop-types';

/**
 * GridWrapper Component
 * 
 * A production-ready AG-Grid wrapper for React 18 + Vite
 * Features:
 * - Dynamic column visibility
 * - Quick search
 * - CSV export
 * - Column state persistence
 * - Row selection
 * - Server-side ready
 * 
 * @param {Object} props - Component props
 * @returns {JSX.Element} Grid component
 */
const GridWrapper = ({
  // Data
  rowData = [],
  loading = false,
  
  // Column Configuration
  columnDefs: customColumnDefs,
  columnVisibilityConfig: customVisibilityConfig,
  
  // Grid Options
  gridOptions: customGridOptions,
  
  // Features
  enableQuickSearch = true,
  enableExport = true,
  enableColumnVisibilityToggle = true,
  enableRowSelection = true,
  
  // Pagination
  pagination = true,
  paginationPageSize = 25,
  
  // Callbacks
  onGridReady,
  onRowClick,
  onRowDoubleClick,
  onSelectionChanged,
  onFilterChanged,
  onSortChanged,
  
  // Styling
  className = '',
  height = '600px',
  theme = 'ag-theme-alpine',
  
  // Server-side
  rowModelType = 'clientSide',
  serverSideDatasource,
  
  // Refs
  gridRef: externalGridRef
}) => {
  // Internal refs
  const internalGridRef = useRef(null);
  const gridRef = externalGridRef || internalGridRef;
  
  // State
  const [quickSearchText, setQuickSearchText] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);
  const [isLoading, setIsLoading] = useState(loading);
  
  // Merge visibility config with defaults
  const visibilityConfig = useMemo(() => {
    return mergeColumnVisibilityConfig(customVisibilityConfig);
  }, [customVisibilityConfig]);
  
  // Get column visibility map
  const columnVisibility = useMemo(() => {
    return getColumnVisibility(visibilityConfig);
  }, [visibilityConfig]);
  
  // Build column definitions with visibility
  const columnDefs = useMemo(() => {
    const baseColumnDefs = customColumnDefs || getDefaultColumnDefs();
    return updateColumnVisibility(baseColumnDefs, columnVisibility);
  }, [customColumnDefs, columnVisibility]);
  
  // Build grid options
  const gridOptions = useMemo(() => {
    const baseOptions = getDefaultGridOptions({
      pagination,
      paginationPageSize,
      rowModelType,
      rowSelection: enableRowSelection ? 'multiple' : 'none'
    });
    
    return {
      ...baseOptions,
      ...customGridOptions,
      onGridReady: (params) => {
        baseOptions.onGridReady?.(params);
        customGridOptions?.onGridReady?.(params);
        onGridReady?.(params);
        
        // Apply default sort (timeiso_u descending)
        if (params.columnApi.getColumn('timeiso_u')) {
          params.api.applyColumnState({
            state: [
              { colId: 'timeiso_u', sort: 'desc', sortIndex: 0 }
            ],
            defaultState: { sort: null }
          });
        }
      },
      onRowClicked: (params) => {
        customGridOptions?.onRowClicked?.(params);
        onRowClick?.(params);
      },
      onRowDoubleClicked: (params) => {
        customGridOptions?.onRowDoubleClicked?.(params);
        onRowDoubleClick?.(params);
      },
      onSelectionChanged: (params) => {
        const selectedNodes = params.api.getSelectedNodes();
        const selectedData = selectedNodes.map(node => node.data);
        setSelectedRows(selectedData);
        customGridOptions?.onSelectionChanged?.(params);
        onSelectionChanged?.(selectedData, params);
      },
      onFilterChanged: (params) => {
        customGridOptions?.onFilterChanged?.(params);
        onFilterChanged?.(params);
      },
      onSortChanged: (params) => {
        customGridOptions?.onSortChanged?.(params);
        onSortChanged?.(params);
      }
    };
  }, [
    customGridOptions, 
    pagination, 
    paginationPageSize, 
    rowModelType, 
    enableRowSelection,
    onGridReady, 
    onRowClick, 
    onRowDoubleClick, 
    onSelectionChanged,
    onFilterChanged,
    onSortChanged
  ]);
  
  // Handle quick search
  useEffect(() => {
    if (gridRef.current && gridRef.current.api) {
      gridRef.current.api.setQuickFilter(quickSearchText);
    }
  }, [quickSearchText, gridRef]);
  
  // Handle loading state
  useEffect(() => {
    setIsLoading(loading);
    if (gridRef.current && gridRef.current.api) {
      if (loading) {
        gridRef.current.api.showLoadingOverlay();
      } else {
        gridRef.current.api.hideOverlay();
      }
    }
  }, [loading, gridRef]);
  
  // Export to CSV
  const handleExportCSV = useCallback(() => {
    if (gridRef.current && gridRef.current.api) {
      const selectedOnly = selectedRows.length > 0;
      gridRef.current.api.exportDataAsCsv({
        fileName: `shareandinvite_export_${new Date().toISOString().split('T')[0]}.csv`,
        onlySelected: selectedOnly,
        columnKeys: columnDefs
          .filter(col => !col.hide)
          .map(col => col.field || col.colId)
      });
    }
  }, [gridRef, selectedRows, columnDefs]);
  
  // Refresh data
  const handleRefresh = useCallback(() => {
    if (gridRef.current && gridRef.current.api) {
      gridRef.current.api.refreshCells({ force: true });
      gridRef.current.api.deselectAll();
    }
  }, [gridRef]);
  
  // Clear filters
  const handleClearFilters = useCallback(() => {
    if (gridRef.current && gridRef.current.api) {
      gridRef.current.api.setFilterModel(null);
      setQuickSearchText('');
    }
  }, [gridRef]);
  
  // Auto-size columns
  const handleAutoSize = useCallback(() => {
    if (gridRef.current && gridRef.current.columnApi) {
      const allColumnIds = [];
      gridRef.current.columnApi.getColumns().forEach((column) => {
        allColumnIds.push(column.getId());
      });
      gridRef.current.columnApi.autoSizeColumns(allColumnIds, false);
    }
  }, [gridRef]);
  
  // Reset column state
  const handleResetColumns = useCallback(() => {
    if (gridRef.current && gridRef.current.columnApi) {
      gridRef.current.columnApi.resetColumnState();
      // Reapply default sort
      if (gridRef.current.columnApi.getColumn('timeiso_u')) {
        gridRef.current.api.applyColumnState({
          state: [
            { colId: 'timeiso_u', sort: 'desc', sortIndex: 0 }
          ],
          defaultState: { sort: null }
        });
      }
    }
  }, [gridRef]);
  
  return (
    <div className={`grid-wrapper ${className}`} style={{ width: '100%' }}>
      {/* Toolbar */}
      <div className="grid-toolbar mb-3 d-flex flex-wrap gap-2 align-items-center">
        {/* Quick Search */}
        {enableQuickSearch && (
          <div className="flex-grow-1" style={{ maxWidth: '300px' }}>
            <div className="input-group">
              <span className="input-group-text">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Quick search..."
                value={quickSearchText}
                onChange={(e) => setQuickSearchText(e.target.value)}
              />
              {quickSearchText && (
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => setQuickSearchText('')}
                >
                  <i className="bi bi-x"></i>
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Spacer */}
        <div className="flex-grow-1"></div>
        
        {/* Row Count */}
        <span className="text-muted small">
          {rowData.length} rows
          {selectedRows.length > 0 && ` (${selectedRows.length} selected)`}
        </span>
        
        {/* Action Buttons */}
        <div className="btn-group">
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={handleRefresh}
            title="Refresh"
          >
            <i className="bi bi-arrow-clockwise"></i>
          </button>
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={handleClearFilters}
            title="Clear Filters"
          >
            <i className="bi bi-funnel"></i>
          </button>
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={handleAutoSize}
            title="Auto-size Columns"
          >
            <i className="bi bi-arrows-angle-expand"></i>
          </button>
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={handleResetColumns}
            title="Reset Columns"
          >
            <i className="bi bi-grid-3x3"></i>
          </button>
        </div>
        
        {/* Export Button */}
        {enableExport && (
          <button
            className="btn btn-primary btn-sm"
            onClick={handleExportCSV}
            disabled={rowData.length === 0}
          >
            <i className="bi bi-download me-1"></i>
            Export CSV
          </button>
        )}
      </div>
      
      {/* Grid Container */}
      <div
        className={theme}
        style={{
          height,
          width: '100%',
          '--ag-row-hover-color': '#f8f9fa',
          '--ag-selected-row-background-color': '#e3f2fd',
          '--ag-header-background-color': '#f8f9fa',
          '--ag-odd-row-background-color': '#ffffff',
          '--ag-even-row-background-color': '#fafafa'
        }}
      >
        <AgGridReact
          ref={gridRef}
          columnDefs={columnDefs}
          rowData={rowData}
          {...gridOptions}
          serverSideDatasource={rowModelType === 'serverSide' ? serverSideDatasource : undefined}
        />
      </div>
      
      {/* Loading Overlay */}
      {isLoading && (
        <div 
          className="position-absolute top-50 start-50 translate-middle"
          style={{ zIndex: 1000 }}
        >
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}
    </div>
  );
};

GridWrapper.propTypes = {
  /** Array of row data */
  rowData: PropTypes.array,
  
  /** Loading state */
  loading: PropTypes.bool,
  
  /** Custom column definitions */
  columnDefs: PropTypes.array,
  
  /** Column visibility configuration */
  columnVisibilityConfig: PropTypes.object,
  
  /** Custom grid options */
  gridOptions: PropTypes.object,
  
  /** Enable quick search */
  enableQuickSearch: PropTypes.bool,
  
  /** Enable CSV export */
  enableExport: PropTypes.bool,
  
  /** Enable column visibility toggle */
  enableColumnVisibilityToggle: PropTypes.bool,
  
  /** Enable row selection */
  enableRowSelection: PropTypes.bool,
  
  /** Enable pagination */
  pagination: PropTypes.bool,
  
  /** Pagination page size */
  paginationPageSize: PropTypes.number,
  
  /** Grid ready callback */
  onGridReady: PropTypes.func,
  
  /** Row click callback */
  onRowClick: PropTypes.func,
  
  /** Row double click callback */
  onRowDoubleClick: PropTypes.func,
  
  /** Selection changed callback */
  onSelectionChanged: PropTypes.func,
  
  /** Filter changed callback */
  onFilterChanged: PropTypes.func,
  
  /** Sort changed callback */
  onSortChanged: PropTypes.func,
  
  /** Additional CSS class */
  className: PropTypes.string,
  
  /** Grid height */
  height: PropTypes.string,
  
  /** AG-Grid theme class */
  theme: PropTypes.string,
  
  /** Row model type */
  rowModelType: PropTypes.oneOf(['clientSide', 'serverSide', 'infinite', 'viewport']),
  
  /** Server-side datasource */
  serverSideDatasource: PropTypes.object,
  
  /** External grid ref */
  gridRef: PropTypes.object
};

export default GridWrapper;
