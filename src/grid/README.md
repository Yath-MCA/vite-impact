# AG-Grid Configuration for Shareandinvite Collection

Production-ready AG-Grid implementation for React 18 + Vite with MongoDB data.

## Features

- **Nested Data Access**: Full support for MongoDB nested documents (titleinfo.*)
- **Date/Time Handling**: ISODate and timestamp formatting with moment.js
- **Dynamic Visibility**: Column groups can be shown/hidden via configuration
- **Server-Side Ready**: Supports client-side, server-side, and infinite scroll models
- **Performance Optimized**: Virtualization, pagination, and memoized configurations
- **Export**: CSV export with selected rows support
- **Quick Search**: Real-time filtering across all columns
- **Production Ready**: Enterprise-grade code structure

## Installation

```bash
# AG-Grid is already installed in your project
npm install ag-grid-react ag-grid-community

# moment.js for date formatting
npm install moment
```

## Quick Start

### Basic Usage

```jsx
import { GridWrapper } from './grid';

const MyComponent = () => {
  const [rowData, setRowData] = useState([]);

  return (
    <GridWrapper
      rowData={rowData}
      height="600px"
    />
  );
};
```

### With Column Visibility Configuration

```jsx
import { GridWrapper } from './grid';

const MyComponent = () => {
  const visibilityConfig = {
    showDocumentInfo: true,
    showWorkflowInfo: true,
    showTaskInfo: false,
    showTimeInfo: true,
    showInternalIds: false
  };

  return (
    <GridWrapper
      rowData={rowData}
      columnVisibilityConfig={visibilityConfig}
      height="600px"
    />
  );
};
```

### Server-Side Model (Large Datasets)

```jsx
import { GridWrapper } from './grid';

const MyComponent = () => {
  const datasource = {
    getRows: (params) => {
      fetch('/api/data', {
        method: 'POST',
        body: JSON.stringify(params.request)
      })
      .then(res => res.json())
      .then(data => {
        params.successCallback(data.rows, data.lastRow);
      });
    }
  };

  return (
    <GridWrapper
      rowModelType="serverSide"
      serverSideDatasource={datasource}
      height="600px"
    />
  );
};
```

## Column Structure

### Document Information
- `doctitle` - Document title from titleinfo
- `authorgroup` - Author group from titleinfo
- `identifier` - Document identifier
- `projecttitle` - Project title
- `client` - Client name
- `type` - Document type
- `division` - Division

### Workflow Information
- `status` - Current status with badge formatting
- `rolename` - Current role
- `nextrole` - Next role in workflow
- `order` - Workflow order

### Task Information
- `taskid` - Task ID
- `roletaskid` - Role task ID
- `roleabstracttaskid` - Role abstract task ID

### Time Information
- `timeiso_c` - Created timestamp (ISO)
- `timeiso_u` - Updated timestamp (ISO)
- `signouttime` - Sign out time
- `ftp` - FTP timestamp
- `fdel` - Fdel value
- `fdel_iso` - Fdel ISO timestamp

## Configuration Options

### Column Visibility Config

```javascript
{
  // Document Info
  showDocumentInfo: true,
  showDocumentTitle: true,
  showAuthorGroup: true,
  showIdentifier: true,
  showProjectTitle: true,
  showClient: true,
  showType: true,
  showDivision: true,
  showCover: false,
  
  // Workflow Info
  showWorkflowInfo: true,
  showStatus: true,
  showCurrentRole: true,
  showNextRole: true,
  showOrder: true,
  
  // Task Info
  showTaskInfo: true,
  showTaskId: true,
  showRoleTaskId: false,
  showRoleAbstractTaskId: false,
  
  // Time Info
  showTimeInfo: true,
  showCreatedTime: true,
  showUpdatedTime: true,
  showSignOutTime: false,
  showFtp: false,
  showFdel: false,
  showFdelIso: false,
  
  // Internal IDs
  showInternalIds: false,
  showDocId: false,
  showFileId: false,
  showDtd: false,
  showEditor: false
}
```

### Grid Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `rowData` | Array | [] | Row data array |
| `loading` | Boolean | false | Loading state |
| `columnDefs` | Array | null | Custom column definitions |
| `columnVisibilityConfig` | Object | {} | Column visibility config |
| `gridOptions` | Object | {} | Additional AG-Grid options |
| `enableQuickSearch` | Boolean | true | Show quick search box |
| `enableExport` | Boolean | true | Enable CSV export |
| `enableRowSelection` | Boolean | true | Enable row selection |
| `pagination` | Boolean | true | Enable pagination |
| `paginationPageSize` | Number | 25 | Rows per page |
| `rowModelType` | String | 'clientSide' | Row model type |
| `serverSideDatasource` | Object | null | Server-side datasource |
| `height` | String | '600px' | Grid height |
| `theme` | String | 'ag-theme-alpine' | AG-Grid theme |

## Date Formatting

All date columns use the format: `DD-MMM-YYYY HH:mm`

Example: `13-Feb-2026 14:30`

## Filter Types

- **Text Filter**: doctitle, identifier, projecttitle, editor
- **Set Filter**: status, client, type, division, rolename (with search)
- **Date Filter**: timeiso_c, timeiso_u, signouttime, ftp, fdel_iso
- **Number Filter**: order, taskid

## Export

Click the "Export CSV" button to download data:
- Exports all filtered rows
- Exports only selected rows if any are selected
- Uses visible columns only
- Filename: `shareandinvite_export_YYYY-MM-DD.csv`

## Styling

The grid uses Bootstrap 5 classes and AG-Grid Alpine theme.

Custom CSS variables available:
```css
--ag-row-hover-color: #f8f9fa
--ag-selected-row-background-color: #e3f2fd
--ag-header-background-color: #f8f9fa
```

## API Integration

### Expected Data Format

```javascript
{
  _id: "ObjectId",
  titleinfo: {
    doctitle: "Document Title",
    authorgroup: "Author Group",
    identifier: "ID-123",
    cover: "cover.jpg",
    projectname: "Project Name"
  },
  projecttitle: "Project Title",
  identifier: "ID-123",
  docid: "DOC-123",
  client: "Client Name",
  dtd: "DTD-1.0",
  type: "Type",
  division: "Division",
  editor: "Editor Name",
  status: "Active",
  taskid: 123,
  fileid: "FILE-123",
  rolename: "author",
  allroles: ["author", "reviewer"],
  order: 1,
  nextrole: {
    rolename: "reviewer"
  },
  timeiso_c: "2026-02-13T10:00:00.000Z",
  timeiso_u: "2026-02-13T14:30:00.000Z",
  time_c: 1707828000,
  time_u: 1707844200,
  signouttime: "2026-02-13T15:00:00.000Z",
  ftp: "2026-02-13T16:00:00.000Z",
  fdel: "value",
  fdel_iso: "2026-02-13T17:00:00.000Z"
}
```

## Performance Tips

1. **Client-Side Model**: Use for < 10,000 rows
2. **Server-Side Model**: Use for > 10,000 rows
3. **Pagination**: Always enable for large datasets
4. **Column Width**: Set appropriate minWidth to prevent layout shifts
5. **Memoization**: Column definitions are memoized by default

## License

AG-Grid Community Edition is used in this project.
