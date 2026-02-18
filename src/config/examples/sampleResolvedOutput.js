/**
 * Sample Resolved Configuration Output
 * 
 * This file demonstrates what the final resolved column definitions
 * look like after processing through the configuration system.
 */

export const SampleResolvedOutput = {
  "collection": "Shareandinvite",
  "columnDefs": [
    {
      "field": "titleinfo.doctitle",
      "colId": "titleinfo_doctitle",
      "headerName": "Doctitle",
      "baseType": "string",
      "dataType": "string",
      "filter": "agTextColumnFilter",
      "filterParams": {
        "filterOptions": ["contains", "notContains"],
        "defaultOption": "contains",
        "debounceMs": 500
      },
      "sortable": true,
      "resizable": true,
      "minWidth": 200,
      "flex": 2,
      "width": 350,
      "pinned": "left",
      "wrapText": false,
      "cellRenderer": "truncateRenderer",
      "floatingFilter": true,
      "wrapHeaderText": true,
      "autoHeaderHeight": true,
      "suppressMenu": false,
      "unSortIcon": true,
      "valueGetter": "[Function: createNestedValueGetter]"
    },
    {
      "field": "titleinfo.authorgroup",
      "colId": "titleinfo_authorgroup",
      "headerName": "Author Group",
      "baseType": "string",
      "dataType": "string",
      "filter": "agTextColumnFilter",
      "filterParams": {
        "filterOptions": ["contains", "notContains", "startsWith", "endsWith"],
        "defaultOption": "contains",
        "debounceMs": 500
      },
      "sortable": true,
      "resizable": true,
      "minWidth": 120,
      "flex": 1,
      "floatingFilter": true,
      "wrapHeaderText": true,
      "autoHeaderHeight": true,
      "suppressMenu": false,
      "unSortIcon": true,
      "valueGetter": "[Function: createNestedValueGetter]"
    },
    {
      "field": "titleinfo.identifier",
      "colId": "titleinfo_identifier",
      "headerName": "Identifier",
      "baseType": "string",
      "dataType": "string",
      "filter": "agTextColumnFilter",
      "filterParams": {
        "filterOptions": ["contains", "equals", "startsWith"],
        "defaultOption": "contains"
      },
      "sortable": true,
      "resizable": true,
      "minWidth": 150,
      "flex": 1.2,
      "floatingFilter": true,
      "wrapHeaderText": true,
      "autoHeaderHeight": true,
      "suppressMenu": false,
      "unSortIcon": true,
      "valueGetter": "[Function: createNestedValueGetter]"
    },
    {
      "field": "projecttitle",
      "colId": "projecttitle",
      "headerName": "Projecttitle",
      "baseType": "string",
      "dataType": "string",
      "filter": "agTextColumnFilter",
      "filterParams": {
        "filterOptions": ["contains", "notContains"],
        "defaultOption": "contains",
        "debounceMs": 500
      },
      "sortable": true,
      "resizable": true,
      "minWidth": 200,
      "flex": 1.5,
      "width": 300,
      "floatingFilter": true,
      "wrapHeaderText": true,
      "autoHeaderHeight": true,
      "suppressMenu": false,
      "unSortIcon": true
    },
    {
      "field": "client",
      "colId": "client",
      "headerName": "Client",
      "baseType": "string",
      "dataType": "string",
      "filter": "agSetColumnFilter",
      "filterParams": {
        "applyMiniFilterWhileTyping": true
      },
      "sortable": true,
      "resizable": true,
      "minWidth": 120,
      "flex": 1,
      "floatingFilter": true,
      "wrapHeaderText": true,
      "autoHeaderHeight": true,
      "suppressMenu": false,
      "unSortIcon": true
    },
    {
      "field": "status",
      "colId": "status",
      "headerName": "Status",
      "baseType": "string",
      "dataType": "string",
      "displayType": "badge",
      "filter": "agSetColumnFilter",
      "filterParams": {
        "applyMiniFilterWhileTyping": true
      },
      "sortable": true,
      "resizable": true,
      "minWidth": 130,
      "width": 130,
      "cellRenderer": "badgeRenderer",
      "cellStyle": {
        "textAlign": "center"
      },
      "floatingFilter": true,
      "wrapHeaderText": true,
      "autoHeaderHeight": true,
      "suppressMenu": false,
      "unSortIcon": true
    },
    {
      "field": "timeiso_u",
      "colId": "timeiso_u",
      "headerName": "Updated",
      "baseType": "date",
      "dataType": "isodate",
      "displayType": "datetime",
      "format": "DD-MMM-YYYY HH:mm",
      "filter": "agDateColumnFilter",
      "filterParams": {
        "filterOptions": ["equals", "notEqual", "lessThan", "lessThanOrEqual", "greaterThan", "greaterThanOrEqual", "inRange"],
        "defaultOption": "equals",
        "browserDatePicker": true
      },
      "valueFormatter": "isoDateFormatter",
      "comparator": "isoDateComparator",
      "sortable": true,
      "resizable": true,
      "minWidth": 160,
      "width": 160,
      "sort": "desc",
      "sortIndex": 0,
      "floatingFilter": true,
      "wrapHeaderText": true,
      "autoHeaderHeight": true,
      "suppressMenu": false,
      "unSortIcon": true
    },
    {
      "field": "_id",
      "colId": "_id",
      "headerName": "ID",
      "baseType": "string",
      "dataType": "string",
      "filter": "agTextColumnFilter",
      "sortable": true,
      "resizable": true,
      "minWidth": 220,
      "hide": true,
      "suppressColumnsToolPanel": false,
      "floatingFilter": true,
      "wrapHeaderText": true,
      "autoHeaderHeight": true,
      "suppressMenu": false,
      "unSortIcon": true
    }
  ],
  "context": {
    "role": "editor",
    "client": null,
    "userId": null
  },
  "metadata": {
    "totalColumns": 21,
    "visibleColumns": 19,
    "resolvedAt": "2026-02-13T10:00:00.000Z"
  }
};

/**
 * Demonstrates how the configuration system processes fields:
 * 
 * INPUT (Collection Config):
 * {
 *   field: "titleinfo.doctitle",
 *   type: "string-title",
 *   width: 350,
 *   flex: 2,
 *   pinned: "left"
 * }
 * 
 * PRESET (string-title):
 * {
 *   baseType: "string",
 *   filter: "agTextColumnFilter",
 *   filterParams: {...},
 *   sortable: true,
 *   minWidth: 200,
 *   flex: 2,
 *   wrapText: false,
 *   cellRenderer: "truncateRenderer"
 * }
 * 
 * GLOBAL DEFAULTS:
 * {
 *   sortable: true,
 *   resizable: true,
 *   filter: true,
 *   floatingFilter: true,
 *   minWidth: 100,
 *   flex: 1
 * }
 * 
 * OUTPUT (Resolved ColumnDef):
 * {
 *   field: "titleinfo.doctitle",
 *   colId: "titleinfo_doctitle",      // Generated
 *   headerName: "Doctitle",            // Generated from field name
 *   valueGetter: Function,             // Auto-created for nested field
 *   
 *   // From preset (string-title)
 *   baseType: "string",
 *   filter: "agTextColumnFilter",
 *   filterParams: {...},
 *   cellRenderer: "truncateRenderer",
 *   minWidth: 200,
 *   flex: 2,
 *   
 *   // From global defaults
 *   resizable: true,
 *   floatingFilter: true,
 *   wrapHeaderText: true,
 *   
 *   // From field overrides
 *   width: 350,                        // Override preset width
 *   pinned: "left"                     // Field-specific setting
 * }
 */

export const ResolutionExplanation = `
Resolution Priority (highest to lowest):
┌─────────────────────────────────────┐
│  1. Field-Level Overrides            │
│     - width: 350                     │
│     - pinned: "left"                 │
├─────────────────────────────────────┤
│  2. Preset Configuration             │
│     - type: "string-title"           │
│     - filter: "agTextColumnFilter"   │
│     - cellRenderer: "truncate"       │
│     - minWidth: 200                  │
│     - flex: 2                        │
├─────────────────────────────────────┤
│  3. Global Defaults                  │
│     - sortable: true                 │
│     - resizable: true                │
│     - floatingFilter: true           │
│     - wrapHeaderText: true           │
└─────────────────────────────────────┘

Benefits:
✓ No repetition - Define once in preset, reuse everywhere
✓ Easy maintenance - Change preset, updates all fields
✓ Type safety - Validation catches errors early
✓ Performance - Memoization prevents re-computation
✓ Flexibility - Override any property at field level
`;

export default SampleResolvedOutput;
