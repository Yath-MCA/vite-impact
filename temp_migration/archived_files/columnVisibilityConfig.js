/**
 * Column Visibility Configuration
 * Controls which column groups are displayed
 */

export const defaultColumnVisibilityConfig = {
  // Document Information Group
  showDocumentInfo: true,
  showDocumentTitle: true,
  showAuthorGroup: true,
  showIdentifier: true,
  showProjectTitle: true,
  showClient: true,
  showType: true,
  showDivision: true,
  showCover: false,
  
  // Workflow Information Group
  showWorkflowInfo: true,
  showStatus: true,
  showCurrentRole: true,
  showNextRole: true,
  showOrder: true,
  
  // Task Information Group
  showTaskInfo: true,
  showTaskId: true,
  showRoleTaskId: false,
  showRoleAbstractTaskId: false,
  
  // Time Information Group
  showTimeInfo: true,
  showCreatedTime: true,
  showUpdatedTime: true,
  showSignOutTime: false,
  showFtp: false,
  showFdel: false,
  showFdelIso: false,
  
  // Internal/System IDs
  showInternalIds: false,
  showDocId: false,
  showFileId: false,
  showDtd: false,
  showEditor: false,
  
  // Additional Fields
  showAllRoles: false,
  showFtpStatus: false
};

/**
 * Get column visibility based on config
 * @param {Object} config - Visibility configuration
 * @returns {Object} Column ID to visibility mapping
 */
export const getColumnVisibility = (config = defaultColumnVisibilityConfig) => {
  return {
    // Document Info
    doctitle: config.showDocumentInfo && config.showDocumentTitle,
    authorgroup: config.showDocumentInfo && config.showAuthorGroup,
    identifier: config.showDocumentInfo && config.showIdentifier,
    projecttitle: config.showDocumentInfo && config.showProjectTitle,
    client: config.showDocumentInfo && config.showClient,
    type: config.showDocumentInfo && config.showType,
    division: config.showDocumentInfo && config.showDivision,
    cover: config.showDocumentInfo && config.showCover,
    
    // Workflow Info
    status: config.showWorkflowInfo && config.showStatus,
    rolename: config.showWorkflowInfo && config.showCurrentRole,
    nextrole: config.showWorkflowInfo && config.showNextRole,
    order: config.showWorkflowInfo && config.showOrder,
    
    // Task Info
    taskid: config.showTaskInfo && config.showTaskId,
    roletaskid: config.showTaskInfo && config.showRoleTaskId,
    roleabstracttaskid: config.showTaskInfo && config.showRoleAbstractTaskId,
    
    // Time Info
    timeiso_c: config.showTimeInfo && config.showCreatedTime,
    timeiso_u: config.showTimeInfo && config.showUpdatedTime,
    signouttime: config.showTimeInfo && config.showSignOutTime,
    ftp: config.showTimeInfo && config.showFtp,
    fdel: config.showTimeInfo && config.showFdel,
    fdel_iso: config.showTimeInfo && config.showFdelIso,
    
    // Internal IDs
    docid: config.showInternalIds && config.showDocId,
    fileid: config.showInternalIds && config.showFileId,
    dtd: config.showInternalIds && config.showDtd,
    editor: config.showInternalIds && config.showEditor,
    
    // Additional
    allroles: config.showAllRoles,
    ftp_status: config.showFtpStatus
  };
};

/**
 * Get visible column groups for UI controls
 * @returns {Array} Array of column group configurations
 */
export const getColumnGroups = () => [
  {
    id: 'documentInfo',
    label: 'Document Information',
    configKey: 'showDocumentInfo',
    columns: [
      { key: 'showDocumentTitle', label: 'Document Title', colId: 'doctitle' },
      { key: 'showAuthorGroup', label: 'Author Group', colId: 'authorgroup' },
      { key: 'showIdentifier', label: 'Identifier', colId: 'identifier' },
      { key: 'showProjectTitle', label: 'Project Title', colId: 'projecttitle' },
      { key: 'showClient', label: 'Client', colId: 'client' },
      { key: 'showType', label: 'Type', colId: 'type' },
      { key: 'showDivision', label: 'Division', colId: 'division' }
    ]
  },
  {
    id: 'workflowInfo',
    label: 'Workflow Information',
    configKey: 'showWorkflowInfo',
    columns: [
      { key: 'showStatus', label: 'Status', colId: 'status' },
      { key: 'showCurrentRole', label: 'Current Role', colId: 'rolename' },
      { key: 'showNextRole', label: 'Next Role', colId: 'nextrole' },
      { key: 'showOrder', label: 'Order', colId: 'order' }
    ]
  },
  {
    id: 'taskInfo',
    label: 'Task Information',
    configKey: 'showTaskInfo',
    columns: [
      { key: 'showTaskId', label: 'Task ID', colId: 'taskid' },
      { key: 'showRoleTaskId', label: 'Role Task ID', colId: 'roletaskid' },
      { key: 'showRoleAbstractTaskId', label: 'Role Abstract Task ID', colId: 'roleabstracttaskid' }
    ]
  },
  {
    id: 'timeInfo',
    label: 'Time Information',
    configKey: 'showTimeInfo',
    columns: [
      { key: 'showCreatedTime', label: 'Created', colId: 'timeiso_c' },
      { key: 'showUpdatedTime', label: 'Updated', colId: 'timeiso_u' },
      { key: 'showSignOutTime', label: 'Sign Out Time', colId: 'signouttime' },
      { key: 'showFtp', label: 'FTP', colId: 'ftp' },
      { key: 'showFdel', label: 'Fdel', colId: 'fdel' },
      { key: 'showFdelIso', label: 'Fdel ISO', colId: 'fdel_iso' }
    ]
  }
];

/**
 * Merge config with defaults
 * @param {Object} userConfig - User-provided config
 * @returns {Object} Merged config
 */
export const mergeColumnVisibilityConfig = (userConfig = {}) => {
  return {
    ...defaultColumnVisibilityConfig,
    ...userConfig
  };
};
