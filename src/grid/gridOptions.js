/**
 * Default Grid Options for AG-Grid
 * Production-ready configuration with performance optimizations
 */

import { getDateFilterComparator, isoDateComparator, timestampComparator } from './dateUtils';

/**
 * Get default grid options
 * @param {Object} customOptions - Custom options to merge
 * @returns {Object} Complete grid options
 */
export const getDefaultGridOptions = (customOptions = {}) => {
  const baseOptions = {
    // Row Model
    rowModelType: 'clientSide',
    
    // Pagination
    pagination: true,
    paginationPageSize: 25,
    paginationPageSizeSelector: [10, 25, 50, 100, 200],
    
    // Row Selection
    rowSelection: 'multiple',
    suppressRowClickSelection: false,
    suppressMultiRangeSelection: false,
    
    // Sorting
    sortable: true,
    unSortIcon: true,
    multiSortKey: 'ctrl',
    
    // Filtering
    floatingFilters: true,
    suppressMenu: false,
    
    // Row Height & Virtualization
    rowHeight: 42,
    headerHeight: 40,
    groupHeaderHeight: 40,
    domLayout: 'autoHeight',
    
    // Performance
    rowBuffer: 10,
    blockLoadDebounceMillis: 100,
    cacheBlockSize: 100,
    maxBlocksInCache: 10,
    cacheOverflowSize: 2,
    maxConcurrentDatasourceRequests: 2,
    infiniteInitialRowCount: 100,
    
    // Column Defaults
    defaultColDef: {
      sortable: true,
      resizable: true,
      filter: true,
      floatingFilter: true,
      flex: 1,
      minWidth: 100,
      wrapHeaderText: true,
      autoHeaderHeight: true,
      suppressMenu: false
    },
    
    // Auto-sizing
    autoSizePadding: 20,
    colResizeDefault: 'shift',
    
    // Animation
    animateRows: true,
    
    // Loading
    overlayLoadingTemplate: '<span class="ag-overlay-loading-center">Loading data...</span>',
    overlayNoRowsTemplate: '<span class="ag-overlay-no-rows-center">No data found</span>',
    
    // Locale Text
    localeText: {
      page: 'Page',
      more: 'More',
      to: 'to',
      of: 'of',
      next: 'Next',
      last: 'Last',
      first: 'First',
      previous: 'Previous',
      loadingOoo: 'Loading...',
      noRowsToShow: 'No rows to show',
      searchOoo: 'Search...',
      blanks: 'Blanks',
      selectAll: 'Select All',
      clearFilter: 'Clear Filter'
    },
    
    // Export
    defaultExportParams: {
      fileName: 'export.csv',
      columnKeys: null,
      allColumns: false,
      onlySelected: false,
      suppressQuotes: false,
      processCellCallback: null,
      processHeaderCallback: null
    },
    
    // Side Bar (if using enterprise)
    sideBar: {
      toolPanels: [
        {
          id: 'columns',
          labelDefault: 'Columns',
          labelKey: 'columns',
          iconKey: 'columns',
          toolPanel: 'agColumnsToolPanel',
          toolPanelParams: {
            suppressRowGroups: true,
            suppressValues: true,
            suppressPivots: true,
            suppressPivotMode: true,
            suppressColumnFilter: false,
            suppressColumnSelectAll: false,
            suppressColumnExpandAll: false
          }
        },
        {
          id: 'filters',
          labelDefault: 'Filters',
          labelKey: 'filters',
          iconKey: 'filter',
          toolPanel: 'agFiltersToolPanel'
        }
      ],
      defaultToolPanel: 'columns',
      hiddenByDefault: false
    },
    
    // Column State Persistence
    maintainColumnOrder: true,
    suppressColumnMoveAnimation: false,
    
    // Navigation
    navigateToNextCell: null,
    tabToNextCell: null,
    enableCellTextSelection: true,
    ensureDomOrder: false,
    
    // Clipboard (if using enterprise)
    copyHeadersToClipboard: true,
    suppressCopyRowsToClipboard: false,
    clipboardDelimiter: '\t',
    
    // Context Menu
    allowContextMenuWithControlKey: true,
    preventDefaultOnContextMenu: false,
    getContextMenuItems: getDefaultContextMenuItems,
    
    // Tooltips
    enableBrowserTooltips: true,
    tooltipShowDelay: 500,
    tooltipHideDelay: 10000,
    
    // Icons
    icons: {
      sortAscending: '<i class="bi bi-arrow-up"></i>',
      sortDescending: '<i class="bi bi-arrow-down"></i>',
      sortUnSort: '<i class="bi bi-arrow-down-up"></i>',
      menu: '<i class="bi bi-three-dots-vertical"></i>',
      filter: '<i class="bi bi-funnel"></i>',
      columns: '<i class="bi bi-layout-three-columns"></i>'
    },
    
    // Grid Events
    onGridReady: (params) => {
      console.log('Grid ready:', params);
    },
    
    onFirstDataRendered: (params) => {
      // Auto-size columns after first render
      const allColumnIds = [];
      params.columnApi.getColumns().forEach((column) => {
        allColumnIds.push(column.getId());
      });
      params.columnApi.autoSizeColumns(allColumnIds, false);
    },
    
    // Suppress warnings
    suppressPropertyNamesCheck: false,
    
    // Debug
    debug: false
  };
  
  return {
    ...baseOptions,
    ...customOptions,
    defaultColDef: {
      ...baseOptions.defaultColDef,
      ...(customOptions.defaultColDef || {})
    }
  };
};

/**
 * Get default context menu items
 * @param {Object} params - AG-Grid context menu params
 * @returns {Array} Menu items
 */
export const getDefaultContextMenuItems = (params) => {
  const result = [
    'copy',
    'copyWithHeaders',
    'separator',
    'csvExport',
    'excelExport',
    'separator',
    {
      name: 'Auto-size This Column',
      action: () => {
        params.columnApi.autoSizeColumn(params.column.getId());
      }
    },
    {
      name: 'Auto-size All Columns',
      action: () => {
        const allColumnIds = [];
        params.columnApi.getColumns().forEach((column) => {
          allColumnIds.push(column.getId());
        });
        params.columnApi.autoSizeColumns(allColumnIds, false);
      }
    },
    'separator',
    'resetColumns'
  ];
  
  return result;
};

/**
 * Get server-side grid options for large datasets
 * @param {Object} customOptions - Custom options
 * @returns {Object} Server-side grid options
 */
export const getServerSideGridOptions = (customOptions = {}) => {
  return getDefaultGridOptions({
    rowModelType: 'serverSide',
    serverSideStoreType: 'partial',
    cacheBlockSize: 100,
    maxBlocksInCache: 10,
    ...customOptions
  });
};

/**
 * Get infinite scroll grid options
 * @param {Object} customOptions - Custom options
 * @returns {Object} Infinite scroll grid options
 */
export const getInfiniteScrollGridOptions = (customOptions = {}) => {
  return getDefaultGridOptions({
    rowModelType: 'infinite',
    cacheBlockSize: 100,
    maxBlocksInCache: 10,
    ...customOptions
  });
};

export default getDefaultGridOptions;
