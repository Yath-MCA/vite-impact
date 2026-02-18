/**
 * Shareandinvite Collection Configuration
 * 
 * Example collection configuration using the preset-based system.
 * Demonstrates how to define fields without repeating configuration.
 */

export const ShareandinviteCollectionConfig = {
  collection: "Shareandinvite",
  
  // Optional context for role/client-based overrides
  context: {
    role: "editor", // 'admin', 'editor', 'viewer'
    client: null,
    userId: null
  },

  fields: [
    // ==================== DOCUMENT INFORMATION ====================
    {
      field: "titleinfo.doctitle",
      type: "string-title",
      width: 350,
      flex: 2,
      pinned: "left"
    },
    {
      field: "titleinfo.authorgroup",
      type: "string-format-1",
      title: "Author Group"
    },
    {
      field: "titleinfo.identifier",
      type: "string-identifier",
      title: "Identifier"
    },
    {
      field: "projecttitle",
      type: "string-title",
      width: 300,
      flex: 1.5
    },
    {
      field: "client",
      type: "string-format-1",
      filter: "agSetColumnFilter"
    },
    {
      field: "type",
      type: "string-format-1"
    },
    {
      field: "division",
      type: "string-format-1"
    },

    // ==================== WORKFLOW INFORMATION ====================
    {
      field: "status",
      type: "string-badge",
      width: 130
    },
    {
      field: "rolename",
      type: "string-format-1",
      title: "Current Role",
      valueFormatter: "roleNameFormatter"
    },
    {
      field: "nextrole.rolename",
      type: "nested-role",
      title: "Next Role",
      valueGetter: true
    },
    {
      field: "order",
      type: "number-order",
      width: 90
    },
    {
      field: "allroles",
      type: "array-roles",
      title: "All Roles",
      width: 200
    },

    // ==================== TASK INFORMATION ====================
    {
      field: "taskid",
      type: "number-integer",
      hide: false
    },
    {
      field: "roletaskid",
      type: "string-format-1",
      hide: true
    },
    {
      field: "roleabstracttaskid",
      type: "string-format-1",
      hide: true
    },

    // ==================== TIME INFORMATION ====================
    {
      field: "timeiso_c",
      type: "date-format-1",
      title: "Created"
    },
    {
      field: "timeiso_u",
      type: "date-format-1",
      title: "Updated",
      sort: "desc",
      sortIndex: 0
    },
    {
      field: "time_c",
      type: "timestamp-seconds",
      title: "Created (Timestamp)",
      hide: true
    },
    {
      field: "time_u",
      type: "timestamp-seconds",
      title: "Updated (Timestamp)",
      hide: true
    },
    {
      field: "signouttime",
      type: "date-format-1",
      title: "Sign Out Time",
      hide: true
    },
    {
      field: "ftp",
      type: "date-format-1",
      title: "FTP",
      hide: true
    },
    {
      field: "fdel",
      type: "string-format-1",
      hide: true
    },
    {
      field: "fdel_iso",
      type: "date-format-1",
      title: "Fdel ISO",
      hide: true
    },

    // ==================== INTERNAL IDS (Hidden by default) ====================
    {
      field: "_id",
      type: "mongo-id",
      title: "ID"
    },
    {
      field: "docid",
      type: "string-identifier",
      hide: true
    },
    {
      field: "fileid",
      type: "string-identifier",
      hide: true
    },
    {
      field: "dtd",
      type: "string-format-1",
      hide: true
    },
    {
      field: "editor",
      type: "string-format-1",
      hide: true
    }
  ]
};

export default ShareandinviteCollectionConfig;
