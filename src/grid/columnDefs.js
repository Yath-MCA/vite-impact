/**
 * Column Definitions for Shareandinvite Collection
 * Production-ready column configuration with nested data access
 */

import {
  statusFormatter,
  roleNameFormatter,
  docTitleFormatter,
  authorGroupFormatter,
  identifierFormatter,
  projectNameFormatter,
  isoDateFormatter,
  timestampFormatter,
  booleanFormatter,
  allRolesFormatter,
  getNestedValue,
  truncateFormatter
} from './valueFormatters';

import { 
  isoDateComparator, 
  timestampComparator, 
  getDateFilterComparator 
} from './dateUtils';

/**
 * Document Information Columns
 */
export const documentInfoColumns = [
  {
    field: 'titleinfo.doctitle',
    headerName: 'Document Title',
    colId: 'doctitle',
    width: 300,
    minWidth: 200,
    flex: 2,
    filter: 'agTextColumnFilter',
    filterParams: {
      filterOptions: ['contains', 'notContains', 'startsWith', 'endsWith'],
      defaultOption: 'contains',
      debounceMs: 500
    },
    valueGetter: (params) => getNestedValue(params.data, 'titleinfo.doctitle', ''),
    valueFormatter: (params) => params.value || '-',
    cellRenderer: (params) => {
      const title = params.value || '-';
      return `<span title="${title}">${truncateFormatter({ value: title }, 60)}</span>`;
    },
    tooltipField: 'titleinfo.doctitle',
    sortable: true,
    pinned: 'left'
  },
  {
    field: 'titleinfo.authorgroup',
    headerName: 'Author Group',
    colId: 'authorgroup',
    width: 150,
    minWidth: 120,
    filter: 'agTextColumnFilter',
    valueGetter: (params) => getNestedValue(params.data, 'titleinfo.authorgroup', ''),
    valueFormatter: roleNameFormatter,
    sortable: true
  },
  {
    field: 'titleinfo.identifier',
    headerName: 'Identifier',
    colId: 'identifier',
    width: 180,
    minWidth: 150,
    filter: 'agTextColumnFilter',
    filterParams: {
      filterOptions: ['contains', 'equals', 'startsWith'],
      defaultOption: 'contains'
    },
    valueGetter: (params) => getNestedValue(params.data, 'titleinfo.identifier', ''),
    sortable: true
  },
  {
    field: 'projecttitle',
    headerName: 'Project Title',
    colId: 'projecttitle',
    width: 250,
    minWidth: 180,
    flex: 1.5,
    filter: 'agTextColumnFilter',
    filterParams: {
      filterOptions: ['contains', 'notContains'],
      defaultOption: 'contains',
      debounceMs: 500
    },
    cellRenderer: (params) => {
      const title = params.value || '-';
      return `<span title="${title}">${truncateFormatter({ value: title }, 50)}</span>`;
    },
    sortable: true
  },
  {
    field: 'client',
    headerName: 'Client',
    colId: 'client',
    width: 150,
    minWidth: 120,
    filter: 'agSetColumnFilter',
    filterParams: {
      applyMiniFilterWhileTyping: true,
      debounceMs: 500
    },
    sortable: true
  },
  {
    field: 'type',
    headerName: 'Type',
    colId: 'type',
    width: 120,
    minWidth: 100,
    filter: 'agSetColumnFilter',
    filterParams: {
      applyMiniFilterWhileTyping: true
    },
    sortable: true
  },
  {
    field: 'division',
    headerName: 'Division',
    colId: 'division',
    width: 140,
    minWidth: 120,
    filter: 'agSetColumnFilter',
    sortable: true
  },
  {
    field: 'titleinfo.cover',
    headerName: 'Cover',
    colId: 'cover',
    width: 100,
    minWidth: 80,
    hide: true,
    valueGetter: (params) => getNestedValue(params.data, 'titleinfo.cover', ''),
    filter: 'agTextColumnFilter',
    sortable: true
  }
];

/**
 * Workflow Information Columns
 */
export const workflowInfoColumns = [
  {
    field: 'status',
    headerName: 'Status',
    colId: 'status',
    width: 130,
    minWidth: 110,
    filter: 'agSetColumnFilter',
    filterParams: {
      applyMiniFilterWhileTyping: true
    },
    cellRenderer: statusFormatter,
    sortable: true,
    cellStyle: { textAlign: 'center' }
  },
  {
    field: 'rolename',
    headerName: 'Current Role',
    colId: 'rolename',
    width: 150,
    minWidth: 130,
    filter: 'agSetColumnFilter',
    filterParams: {
      applyMiniFilterWhileTyping: true
    },
    valueFormatter: roleNameFormatter,
    sortable: true
  },
  {
    field: 'nextrole.rolename',
    headerName: 'Next Role',
    colId: 'nextrole',
    width: 150,
    minWidth: 130,
    filter: 'agSetColumnFilter',
    filterParams: {
      applyMiniFilterWhileTyping: true
    },
    valueGetter: (params) => getNestedValue(params.data, 'nextrole.rolename', ''),
    valueFormatter: roleNameFormatter,
    sortable: true
  },
  {
    field: 'order',
    headerName: 'Order',
    colId: 'order',
    width: 100,
    minWidth: 80,
    filter: 'agNumberColumnFilter',
    filterParams: {
      filterOptions: ['equals', 'notEqual', 'lessThan', 'lessThanOrEqual', 'greaterThan', 'greaterThanOrEqual', 'inRange'],
      defaultOption: 'equals'
    },
    sortable: true,
    type: 'numericColumn',
    cellStyle: { textAlign: 'right' }
  },
  {
    field: 'allroles',
    headerName: 'All Roles',
    colId: 'allroles',
    width: 200,
    minWidth: 150,
    hide: true,
    filter: 'agSetColumnFilter',
    valueFormatter: allRolesFormatter,
    sortable: false,
    tooltipField: 'allroles'
  }
];

/**
 * Task Information Columns
 */
export const taskInfoColumns = [
  {
    field: 'taskid',
    headerName: 'Task ID',
    colId: 'taskid',
    width: 120,
    minWidth: 100,
    filter: 'agNumberColumnFilter',
    filterParams: {
      filterOptions: ['equals', 'notEqual', 'lessThan', 'greaterThan', 'inRange'],
      defaultOption: 'equals'
    },
    sortable: true,
    type: 'numericColumn',
    hide: true
  },
  {
    field: 'roletaskid',
    headerName: 'Role Task ID',
    colId: 'roletaskid',
    width: 140,
    minWidth: 120,
    filter: 'agTextColumnFilter',
    sortable: true,
    hide: true
  },
  {
    field: 'roleabstracttaskid',
    headerName: 'Role Abstract Task ID',
    colId: 'roleabstracttaskid',
    width: 180,
    minWidth: 150,
    filter: 'agTextColumnFilter',
    sortable: true,
    hide: true
  }
];

/**
 * Time Information Columns
 */
export const timeInfoColumns = [
  {
    field: 'timeiso_c',
    headerName: 'Created',
    colId: 'timeiso_c',
    width: 160,
    minWidth: 140,
    filter: 'agDateColumnFilter',
    filterParams: {
      filterOptions: ['equals', 'notEqual', 'lessThan', 'lessThanOrEqual', 'greaterThan', 'greaterThanOrEqual', 'inRange'],
      defaultOption: 'equals',
      comparator: getDateFilterComparator(),
      browserDatePicker: true
    },
    valueFormatter: isoDateFormatter,
    comparator: isoDateComparator,
    sortable: true
  },
  {
    field: 'timeiso_u',
    headerName: 'Updated',
    colId: 'timeiso_u',
    width: 160,
    minWidth: 140,
    filter: 'agDateColumnFilter',
    filterParams: {
      filterOptions: ['equals', 'notEqual', 'lessThan', 'lessThanOrEqual', 'greaterThan', 'greaterThanOrEqual', 'inRange'],
      defaultOption: 'equals',
      comparator: getDateFilterComparator(),
      browserDatePicker: true
    },
    valueFormatter: isoDateFormatter,
    comparator: isoDateComparator,
    sortable: true,
    sort: 'desc',
    sortIndex: 0
  },
  {
    field: 'time_c',
    headerName: 'Created (Timestamp)',
    colId: 'time_c',
    width: 160,
    minWidth: 140,
    hide: true,
    filter: 'agNumberColumnFilter',
    valueFormatter: timestampFormatter,
    comparator: timestampComparator,
    sortable: true
  },
  {
    field: 'time_u',
    headerName: 'Updated (Timestamp)',
    colId: 'time_u',
    width: 160,
    minWidth: 140,
    hide: true,
    filter: 'agNumberColumnFilter',
    valueFormatter: timestampFormatter,
    comparator: timestampComparator,
    sortable: true
  },
  {
    field: 'signouttime',
    headerName: 'Sign Out Time',
    colId: 'signouttime',
    width: 160,
    minWidth: 140,
    hide: true,
    filter: 'agDateColumnFilter',
    filterParams: {
      comparator: getDateFilterComparator(),
      browserDatePicker: true
    },
    valueFormatter: isoDateFormatter,
    comparator: isoDateComparator,
    sortable: true
  },
  {
    field: 'ftp',
    headerName: 'FTP',
    colId: 'ftp',
    width: 100,
    minWidth: 80,
    hide: true,
    filter: 'agDateColumnFilter',
    filterParams: {
      comparator: getDateFilterComparator(),
      browserDatePicker: true
    },
    valueFormatter: isoDateFormatter,
    comparator: isoDateComparator,
    sortable: true
  },
  {
    field: 'fdel',
    headerName: 'Fdel',
    colId: 'fdel',
    width: 120,
    minWidth: 100,
    hide: true,
    filter: 'agTextColumnFilter',
    sortable: true
  },
  {
    field: 'fdel_iso',
    headerName: 'Fdel ISO',
    colId: 'fdel_iso',
    width: 160,
    minWidth: 140,
    hide: true,
    filter: 'agDateColumnFilter',
    filterParams: {
      comparator: getDateFilterComparator(),
      browserDatePicker: true
    },
    valueFormatter: isoDateFormatter,
    comparator: isoDateComparator,
    sortable: true
  }
];

/**
 * Internal/System ID Columns
 */
export const internalIdColumns = [
  {
    field: '_id',
    headerName: 'ID',
    colId: '_id',
    width: 220,
    minWidth: 200,
    hide: true,
    filter: 'agTextColumnFilter',
    sortable: true,
    pinned: null
  },
  {
    field: 'docid',
    headerName: 'Doc ID',
    colId: 'docid',
    width: 150,
    minWidth: 120,
    hide: true,
    filter: 'agTextColumnFilter',
    sortable: true
  },
  {
    field: 'fileid',
    headerName: 'File ID',
    colId: 'fileid',
    width: 150,
    minWidth: 120,
    hide: true,
    filter: 'agTextColumnFilter',
    sortable: true
  },
  {
    field: 'dtd',
    headerName: 'DTD',
    colId: 'dtd',
    width: 120,
    minWidth: 100,
    hide: true,
    filter: 'agTextColumnFilter',
    sortable: true
  },
  {
    field: 'editor',
    headerName: 'Editor',
    colId: 'editor',
    width: 150,
    minWidth: 120,
    hide: true,
    filter: 'agTextColumnFilter',
    sortable: true
  }
];

/**
 * Get all column definitions
 * @returns {Array} All column definitions
 */
export const getAllColumnDefs = () => [
  ...documentInfoColumns,
  ...workflowInfoColumns,
  ...taskInfoColumns,
  ...timeInfoColumns,
  ...internalIdColumns
];

/**
 * Get column definitions by group
 * @param {Array} groups - Array of group names ['document', 'workflow', 'task', 'time', 'internal']
 * @returns {Array} Column definitions for specified groups
 */
export const getColumnDefsByGroup = (groups = []) => {
  const groupMap = {
    document: documentInfoColumns,
    workflow: workflowInfoColumns,
    task: taskInfoColumns,
    time: timeInfoColumns,
    internal: internalIdColumns
  };
  
  let columns = [];
  
  if (groups.length === 0) {
    return getAllColumnDefs();
  }
  
  groups.forEach(group => {
    if (groupMap[group]) {
      columns = [...columns, ...groupMap[group]];
    }
  });
  
  return columns;
};

/**
 * Get default visible column definitions
 * @returns {Array} Default visible columns
 */
export const getDefaultColumnDefs = () => [
  ...documentInfoColumns,
  ...workflowInfoColumns,
  {
    field: 'taskid',
    headerName: 'Task ID',
    colId: 'taskid',
    width: 120,
    minWidth: 100,
    filter: 'agNumberColumnFilter',
    sortable: true,
    type: 'numericColumn',
    hide: false
  },
  {
    field: 'timeiso_c',
    headerName: 'Created',
    colId: 'timeiso_c',
    width: 160,
    minWidth: 140,
    filter: 'agDateColumnFilter',
    filterParams: {
      comparator: getDateFilterComparator(),
      browserDatePicker: true
    },
    valueFormatter: isoDateFormatter,
    comparator: isoDateComparator,
    sortable: true
  },
  {
    field: 'timeiso_u',
    headerName: 'Updated',
    colId: 'timeiso_u',
    width: 160,
    minWidth: 140,
    filter: 'agDateColumnFilter',
    filterParams: {
      comparator: getDateFilterComparator(),
      browserDatePicker: true
    },
    valueFormatter: isoDateFormatter,
    comparator: isoDateComparator,
    sortable: true,
    sort: 'desc',
    sortIndex: 0
  }
];

/**
 * Update column visibility based on config
 * @param {Array} columnDefs - Column definitions
 * @param {Object} visibilityConfig - Visibility configuration
 * @returns {Array} Updated column definitions
 */
export const updateColumnVisibility = (columnDefs, visibilityConfig) => {
  if (!visibilityConfig || Object.keys(visibilityConfig).length === 0) {
    return columnDefs;
  }
  
  return columnDefs.map(col => {
    const colId = col.colId || col.field;
    if (visibilityConfig.hasOwnProperty(colId)) {
      return {
        ...col,
        hide: !visibilityConfig[colId]
      };
    }
    return col;
  });
};

export default getAllColumnDefs;
