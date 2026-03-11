/**
 * AG-Grid Wrapper Component
 * Modular data grid with sorting, filtering, pagination
 */

import React, { useMemo, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { AgGridReact } from 'ag-grid-react';

// Import AG Grid styles
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

const GridWrapper = forwardRef(({
  rowData = [],
  columnDefs = [],
  defaultColDef = {},
  pagination = true,
  paginationPageSize = 25,
  rowSelection = 'single',
  onRowClick,
  onRowDoubleClick,
  onSelectionChanged,
  onCellValueChanged,
  onGridReady,
  className = '',
  height = '400px',
  loading = false,
  suppressRowClickSelection = false,
  ...props
}, ref) => {
  const gridRef = useRef(null);

  // Default column definition
  const defaultColDefMerged = useMemo(() => ({
    resizable: true,
    sortable: true,
    filter: true,
    flex: 1,
    minWidth: 100,
    ...defaultColDef
  }), [defaultColDef]);

  // Default pagination options
  const paginationPageSizeSelector = useMemo(() => {
    return [10, 25, 50, 100];
  }, []);

  // Event handlers
  const handleRowClicked = useCallback((event) => {
    onRowClick?.(event.data, event);
  }, [onRowClick]);

  const handleRowDoubleClicked = useCallback((event) => {
    onRowDoubleClick?.(event.data, event);
  }, [onRowDoubleClick]);

  const handleSelectionChanged = useCallback((event) => {
    const selectedRows = event.api.getSelectedRows();
    onSelectionChanged?.(selectedRows, event);
  }, [onSelectionChanged]);

  const handleCellValueChanged = useCallback((event) => {
    onCellValueChanged?.(event.data, event);
  }, [onCellValueChanged]);

  const handleGridReady = useCallback((event) => {
    onGridReady?.(event);
  }, [onGridReady]);

  // Expose imperative methods
  useImperativeHandle(ref, () => ({
    getApi: () => gridRef.current?.api,
    getSelectedRows: () => gridRef.current?.api?.getSelectedRows(),
    getSelectedNodes: () => gridRef.current?.api?.getSelectedNodes(),
    deselectAll: () => gridRef.current?.api?.deselectAll(),
    selectAll: () => gridRef.current?.api?.selectAll(),
    exportToCsv: (params) => gridRef.current?.api?.exportDataAsCsv(params),
    setRowData: (data) => {
      if (gridRef.current?.api) {
        gridRef.current.api.setRowData(data);
      }
    },
    refreshCells: (params) => gridRef.current?.api?.refreshCells(params),
    redrawRows: (params) => gridRef.current?.api?.redrawRows(params)
  }));

  const gridClassName = `ag-theme-alpine ${className}`.trim();

  return (
    <div 
      className={gridClassName}
      style={{ height, width: '100%' }}
    >
      <AgGridReact
        ref={gridRef}
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDefMerged}
        pagination={pagination}
        paginationPageSize={paginationPageSize}
        paginationPageSizeSelector={paginationPageSizeSelector}
        rowSelection={rowSelection}
        suppressRowClickSelection={suppressRowClickSelection}
        onRowClicked={handleRowClicked}
        onRowDoubleClicked={handleRowDoubleClicked}
        onSelectionChanged={handleSelectionChanged}
        onCellValueChanged={handleCellValueChanged}
        onGridReady={handleGridReady}
        loadingOverlayComponent={() => (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
        overlayLoadingTemplate="<span class='ag-overlay-loading-center'>Loading...</span>"
        overlayNoRowsTemplate="<span class='ag-overlay-no-rows-center'>No data available</span>"
        {...props}
      />
    </div>
  );
});

GridWrapper.displayName = 'GridWrapper';

export default GridWrapper;
