# Collection Table Configuration System

A scalable, normalized configuration system for MongoDB-based applications using AG-Grid.

## Overview

This system eliminates repetitive field configuration across collections by introducing **reusable unique-type presets**. Instead of defining filter types, sortability, and other properties for every field, you simply reference a preset ID.

## Architecture

```
┌─────────────────────┐
│   Collection Config │  ← Defines fields with preset references
│   (Shareandinvite)  │
└──────────┬──────────┘
           │
           │ references
           ▼
┌─────────────────────┐
│   Preset Registry   │  ← Reusable type definitions
│  (unique-format-)   │
└──────────┬──────────┘
           │
           │ merged with
           ▼
┌─────────────────────┐
│   Global Defaults   │  ← Base configuration for all fields
└──────────┬──────────┘
           │
           │ produces
           ▼
┌─────────────────────┐
│  AG-Grid ColumnDefs │  ← Final resolved configuration
└─────────────────────┘
```

## Priority Order

```
Field Override > Preset Config > Global Defaults
```

## Quick Start

### 1. Define Collection Configuration

```javascript
import { resolveCollectionConfig } from './config';

const myCollection = {
  collection: "MyCollection",
  fields: [
    { field: "name", type: "string-title" },
    { field: "status", type: "string-badge" },
    { field: "created", type: "date-format-1" },
    { field: "tags", type: "array-chip" }
  ]
};

const resolved = resolveCollectionConfig(myCollection);
// resolved.columnDefs contains AG-Grid column definitions
```

### 2. Use with AG-Grid

```jsx
import { AgGridReact } from 'ag-grid-react';
import { resolveCollectionConfigMemoized } from './config';

const MyGrid = ({ rowData }) => {
  const collectionConfig = {
    collection: "MyCollection",
    fields: [
      { field: "name", type: "string-title" },
      { field: "status", type: "string-badge" }
    ]
  };

  const { columnDefs } = resolveCollectionConfigMemoized(collectionConfig);

  return (
    <AgGridReact
      rowData={rowData}
      columnDefs={columnDefs}
    />
  );
};
```

## Available Presets

### String Types
- `string-format-1` - Basic text field with text filter
- `string-identifier` - ID field with exact match support
- `string-title` - Long text with truncation support
- `string-badge` - Status field rendered as badge

### Date/Time Types
- `date-format-1` - ISODate with datetime display (DD-MMM-YYYY HH:mm)
- `date-only` - Date only display (DD-MMM-YYYY)
- `timestamp-seconds` - Unix timestamp (seconds)

### Number Types
- `number-integer` - Integer with number filter
- `number-order` - Sequential number (centered)

### Array Types
- `array-chip` - Array displayed as chips
- `array-comma` - Comma-separated values
- `array-roles` - Role names with capitalization

### Boolean Types
- `boolean-icon` - Checkmark/X icon
- `boolean-badge` - Yes/No badge

### Object/Nested Types
- `nested-string` - Nested field access
- `nested-role` - Nested role field with formatting

### Special Types
- `mongo-id` - MongoDB ObjectId (hidden by default)
- `file-size` - File size with auto-formatting
- `email` - Email with mailto link
- `url` - URL with clickable link

## Field Configuration

### Basic Field

```javascript
{
  field: "status",
  type: "string-badge"
}
```

### Field with Overrides

```javascript
{
  field: "titleinfo.doctitle",
  type: "string-title",
  width: 400,
  flex: 2,
  pinned: "left",
  sortable: false  // Override preset value
}
```

### Field Options

```javascript
{
  field: "fieldname",           // Required: Field path (supports dot notation)
  type: "preset-id",            // Optional: Preset reference
  
  // Display
  title: "Custom Header",       // Custom header name
  width: 200,                   // Column width
  minWidth: 150,               // Minimum width
  maxWidth: 500,               // Maximum width
  flex: 1,                     // Flex grow ratio
  hide: false,                 // Hidden by default
  pinned: "left",              // Pin to left/right
  
  // Behavior
  sortable: true,              // Allow sorting
  resizable: true,             // Allow resizing
  filter: "agTextColumnFilter", // Filter type
  editable: false,             // Editable cell
  
  // Rendering
  cellRenderer: "myRenderer",  // Custom cell renderer
  valueFormatter: "formatter", // Value formatter
  valueGetter: true,           // Auto-create for nested fields
  cellStyle: { color: "red" }, // CSS styles
  
  // Advanced
  sort: "asc",                 // Default sort direction
  sortIndex: 0,               // Sort priority
  tooltipField: true,         // Enable tooltips
  suppressMenu: false         // Hide column menu
}
```

## Context-Based Configuration

### Role-Based Visibility

```javascript
const config = {
  collection: "MyCollection",
  context: {
    role: "admin"  // 'admin', 'editor', 'viewer'
  },
  fields: [
    { field: "name", type: "string-title" },
    { field: "internalId", type: "mongo-id" }  // Hidden for non-admin
  ]
};
```

Roles:
- `admin` - Sees all fields including internal
- `editor` - Standard access, hides internal fields
- `viewer` - Read-only, hides internal fields

### Client-Based Fields

```javascript
const config = {
  collection: "MyCollection",
  context: {
    client: "client-a"
  },
  fields: [
    // Some fields may be hidden/shown based on client
  ]
};
```

## Global Defaults

Override default behavior for all fields:

```javascript
import { resolveCollectionConfig, DEFAULT_GLOBAL_CONFIG } from './config';

const myDefaults = {
  ...DEFAULT_GLOBAL_CONFIG,
  sortable: false,
  resizable: false,
  minWidth: 150
};

const resolved = resolveCollectionConfig(collectionConfig, {
  globalDefaults: myDefaults
});
```

Default global configuration:
```javascript
{
  sortable: true,
  resizable: true,
  filter: true,
  floatingFilter: true,
  minWidth: 100,
  flex: 1,
  wrapHeaderText: true,
  autoHeaderHeight: true,
  suppressMenu: false,
  unSortIcon: true
}
```

## Custom Presets

Register your own presets:

```javascript
import { presetRegistry } from './config';

presetRegistry.register('my-custom-preset', {
  baseType: 'string',
  filter: 'agTextColumnFilter',
  sortable: true,
  minWidth: 200,
  cellRenderer: 'myRenderer'
});

// Use it
const config = {
  fields: [
    { field: "custom", type: "my-custom-preset" }
  ]
};
```

## Nested Fields

Dot notation is automatically supported:

```javascript
const config = {
  fields: [
    { field: "titleinfo.doctitle", type: "string-title" },
    { field: "user.profile.email", type: "email" },
    { field: "metadata.createdBy.name", type: "string-format-1" }
  ]
};
```

Value getters are automatically created for nested paths.

## Validation

Validate configurations before use:

```javascript
import { validateCollectionConfig, assertValid } from './config';

const config = {
  collection: "Test",
  fields: [
    { field: "name", type: "invalid-preset" }
  ]
};

const validation = validateCollectionConfig(config);
if (!validation.valid) {
  console.error('Errors:', validation.errors);
  console.warn('Warnings:', validation.warnings);
}

// Or throw on invalid
assertValid(validation);
```

## Performance Optimization

Use memoized resolver for caching:

```javascript
import { resolveCollectionConfigMemoized } from './config';

// First call - computes
const result1 = resolveCollectionConfigMemoized(config);

// Second call - returns cached
const result2 = resolveCollectionConfigMemoized(config); // Fast!
```

Cache is keyed by:
- Collection name
- Field names
- Context (role, client, userId)

TTL: 5 minutes
Max size: 500 configurations

## Batch Processing

Resolve multiple collections at once:

```javascript
import { resolveMultipleCollections } from './config';

const configs = [
  { collection: "A", fields: [...] },
  { collection: "B", fields: [...] },
  { collection: "C", fields: [...] }
];

const resolved = resolveMultipleCollections(configs);
```

## Configuration Diff

Compare two configurations:

```javascript
import { getConfigDiff } from './config';

const diff = getConfigDiff(configV1, configV2);
console.log(diff);
// { added: ['newField'], removed: ['oldField'], modified: ['changedField'] }
```

## Export Configuration

Export resolved configuration to JSON:

```javascript
import { exportConfigToJSON } from './config';

const resolved = resolveCollectionConfig(config);
const json = exportConfigToJSON(resolved);

// Save to file or send to API
fs.writeFileSync('grid-config.json', json);
```

## Folder Structure

```
config/
├── presets/
│   └── presetRegistry.js       # Preset definitions and registry
├── collections/
│   ├── index.js               # Collection exports
│   └── Shareandinvite.js      # Example collection
├── resolvers/
│   └── configResolver.js      # Main resolution logic
├── utils/
│   ├── deepMerge.js           # Deep merge utility
│   ├── memoize.js             # Memoization utility
│   └── typeValidation.js      # Validation engine
├── examples/
│   └── usageExamples.js       # Usage examples
└── index.js                   # Main exports
```

## TypeScript Support

While this implementation is in JavaScript, you can add TypeScript definitions:

```typescript
interface FieldConfig {
  field: string;
  type?: string;
  displayType?: string;
  title?: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  flex?: number;
  hide?: boolean;
  pinned?: 'left' | 'right' | boolean;
  sortable?: boolean;
  resizable?: boolean;
  filter?: string | null;
  // ... more properties
}

interface CollectionConfig {
  collection: string;
  context?: {
    role?: string;
    client?: string;
    userId?: string;
  };
  fields: FieldConfig[];
}
```

## Best Practices

1. **Use presets** - Don't repeat configuration, use preset IDs
2. **Override selectively** - Only override when necessary
3. **Validate configs** - Always validate in development
4. **Use memoization** - For better performance in React components
5. **Organize by group** - Group related fields in your config
6. **Document custom presets** - Add comments explaining custom types
7. **Test context overrides** - Verify role-based visibility works

## Examples

See `examples/usageExamples.js` for comprehensive usage examples including:
- Basic usage
- Custom defaults
- Field overrides
- Context-based configuration
- Memoized resolver
- Batch resolution
- Configuration diff
- Export/import
- Custom presets
- Validation
- Nested fields
- React integration

## License

This configuration system is part of your application codebase.
