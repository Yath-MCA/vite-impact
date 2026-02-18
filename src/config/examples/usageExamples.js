/**
 * Configuration System Usage Examples
 * 
 * Demonstrates how to use the preset-based configuration system
 * with various scenarios and use cases.
 */

import {
  resolveCollectionConfig,
  resolveCollectionConfigMemoized,
  resolveMultipleCollections,
  getConfigDiff,
  exportConfigToJSON,
  presetRegistry,
  validateCollectionConfig,
  assertValid,
  ShareandinviteCollectionConfig,
  DEFAULT_GLOBAL_CONFIG
} from '../index';

// ============================================
// EXAMPLE 1: Basic Usage
// ============================================

export const exampleBasicUsage = () => {
  // Define a simple collection configuration
  const collectionConfig = {
    collection: "MyCollection",
    fields: [
      { field: "name", type: "string-title" },
      { field: "status", type: "string-badge" },
      { field: "created", type: "date-format-1" },
      { field: "count", type: "number-integer" }
    ]
  };

  // Resolve to AG-Grid column definitions
  const resolved = resolveCollectionConfig(collectionConfig);

  console.log('Collection:', resolved.collection);
  console.log('Columns:', resolved.columnDefs.length);
  console.log('First column:', resolved.columnDefs[0]);

  return resolved;
};

// ============================================
// EXAMPLE 2: With Custom Global Defaults
// ============================================

export const exampleCustomDefaults = () => {
  const collectionConfig = {
    collection: "CustomDefaults",
    fields: [
      { field: "title", type: "string-title" },
      { field: "amount", type: "number-integer" }
    ]
  };

  const customDefaults = {
    ...DEFAULT_GLOBAL_CONFIG,
    sortable: false,
    resizable: false,
    minWidth: 150
  };

  const resolved = resolveCollectionConfig(collectionConfig, {
    globalDefaults: customDefaults
  });

  console.log('Custom defaults applied');
  return resolved;
};

// ============================================
// EXAMPLE 3: Field-Level Overrides
// ============================================

export const exampleFieldOverrides = () => {
  const collectionConfig = {
    collection: "OverridesExample",
    fields: [
      {
        field: "title",
        type: "string-title",
        // Override preset values
        width: 500,
        flex: 3,
        pinned: "left",
        sortable: false // Override the preset's sortable
      },
      {
        field: "status",
        type: "string-badge",
        // Override display type
        displayType: "custom-badge",
        cellRenderer: "myCustomRenderer"
      }
    ]
  };

  const resolved = resolveCollectionConfig(collectionConfig);
  
  // Verify overrides were applied
  const titleCol = resolved.columnDefs.find(c => c.field === 'title');
  console.log('Title width:', titleCol.width); // 500 (override)
  console.log('Title sortable:', titleCol.sortable); // false (override)

  return resolved;
};

// ============================================
// EXAMPLE 4: Context-Based Configuration (Role-based)
// ============================================

export const exampleContextBased = () => {
  // Admin view - sees everything
  const adminConfig = {
    ...ShareandinviteCollectionConfig,
    context: { role: 'admin' }
  };

  // Editor view - hides internal fields
  const editorConfig = {
    ...ShareandinviteCollectionConfig,
    context: { role: 'editor' }
  };

  // Viewer view - limited access
  const viewerConfig = {
    ...ShareandinviteCollectionConfig,
    context: { role: 'viewer' }
  };

  const adminResolved = resolveCollectionConfig(adminConfig);
  const editorResolved = resolveCollectionConfig(editorConfig);
  const viewerResolved = resolveCollectionConfig(viewerConfig);

  console.log('Admin visible columns:', adminResolved.metadata.visibleColumns);
  console.log('Editor visible columns:', editorResolved.metadata.visibleColumns);
  console.log('Viewer visible columns:', viewerResolved.metadata.visibleColumns);

  return { admin: adminResolved, editor: editorResolved, viewer: viewerResolved };
};

// ============================================
// EXAMPLE 5: Using Memoized Resolver (Performance)
// ============================================

export const exampleMemoizedResolver = () => {
  const config = {
    collection: "MemoizedExample",
    fields: [
      { field: "name", type: "string-title" },
      { field: "date", type: "date-format-1" }
    ]
  };

  // First call - computes and caches
  const start1 = performance.now();
  const result1 = resolveCollectionConfigMemoized(config);
  const time1 = performance.now() - start1;

  // Second call - returns cached result
  const start2 = performance.now();
  const result2 = resolveCollectionConfigMemoized(config);
  const time2 = performance.now() - start2;

  console.log('First call time:', time1.toFixed(3), 'ms');
  console.log('Second call time:', time2.toFixed(3), 'ms');
  console.log('Same result:', result1 === result2); // true (same reference)

  return { result1, time1, time2 };
};

// ============================================
// EXAMPLE 6: Batch Resolution
// ============================================

export const exampleBatchResolution = () => {
  const configs = [
    {
      collection: "CollectionA",
      fields: [
        { field: "name", type: "string-title" },
        { field: "value", type: "number-integer" }
      ]
    },
    {
      collection: "CollectionB",
      fields: [
        { field: "title", type: "string-title" },
        { field: "status", type: "string-badge" }
      ]
    },
    {
      collection: "CollectionC",
      fields: [
        { field: "date", type: "date-format-1" },
        { field: "tags", type: "array-chip" }
      ]
    }
  ];

  const resolvedConfigs = resolveMultipleCollections(configs);

  resolvedConfigs.forEach(resolved => {
    console.log(`${resolved.collection}: ${resolved.columnDefs.length} columns`);
  });

  return resolvedConfigs;
};

// ============================================
// EXAMPLE 7: Configuration Diff
// ============================================

export const exampleConfigDiff = () => {
  const configV1 = {
    collection: "Versioned",
    fields: [
      { field: "name", type: "string-format-1" },
      { field: "status", type: "string-badge" },
      { field: "oldField", type: "string-format-1" }
    ]
  };

  const configV2 = {
    collection: "Versioned",
    fields: [
      { field: "name", type: "string-format-1" },
      { field: "status", type: "string-badge" },
      { field: "newField", type: "date-format-1" }
    ]
  };

  const diff = getConfigDiff(configV1, configV2);

  console.log('Added fields:', diff.added);
  console.log('Removed fields:', diff.removed);
  console.log('Modified fields:', diff.modified);

  return diff;
};

// ============================================
// EXAMPLE 8: Export Configuration
// ============================================

export const exampleExportConfig = () => {
  const resolved = resolveCollectionConfig(ShareandinviteCollectionConfig);
  
  // Export to JSON (functions are converted to identifiers)
  const json = exportConfigToJSON(resolved);
  
  console.log('JSON export length:', json.length);
  
  // Can be saved to file or sent to API
  return json;
};

// ============================================
// EXAMPLE 9: Custom Preset Registration
// ============================================

export const exampleCustomPreset = () => {
  // Register a custom preset
  presetRegistry.register('my-custom-type', {
    baseType: 'string',
    dataType: 'string',
    filter: 'agTextColumnFilter',
    sortable: true,
    minWidth: 200,
    cellRenderer: 'myCustomRenderer',
    cellStyle: { fontWeight: 'bold' }
  });

  // Use the custom preset
  const config = {
    collection: "CustomPreset",
    fields: [
      { field: "customField", type: "my-custom-type" }
    ]
  };

  const resolved = resolveCollectionConfig(config);
  
  console.log('Custom preset applied:', resolved.columnDefs[0].cellRenderer);

  return resolved;
};

// ============================================
// EXAMPLE 10: Validation
// ============================================

export const exampleValidation = () => {
  // Valid configuration
  const validConfig = {
    collection: "Valid",
    fields: [
      { field: "name", type: "string-title" }
    ]
  };

  // Invalid configuration (will throw if assertValid is used)
  const invalidConfig = {
    collection: "Invalid",
    fields: [
      { field: "name", type: "nonexistent-preset" }
    ]
  };

  try {
    // Validation with automatic assertion
    const resolved = resolveCollectionConfig(validConfig, { validate: true });
    console.log('Valid config resolved successfully');

    // This will throw because preset doesn't exist
    resolveCollectionConfig(invalidConfig, { validate: true });
  } catch (error) {
    console.error('Validation error:', error.message);
  }
};

// ============================================
// EXAMPLE 11: Nested Fields
// ============================================

export const exampleNestedFields = () => {
  const config = {
    collection: "NestedExample",
    fields: [
      {
        field: "user.profile.name",
        type: "string-format-1",
        title: "User Name"
      },
      {
        field: "user.profile.email",
        type: "email",
        title: "Email"
      },
      {
        field: "metadata.createdBy.name",
        type: "string-format-1",
        title: "Created By"
      },
      {
        field: "data.nested.deep.value",
        type: "string-format-1",
        title: "Deep Value"
      }
    ]
  };

  const resolved = resolveCollectionConfig(config);

  // Verify value getters were created for nested fields
  resolved.columnDefs.forEach(col => {
    console.log(`${col.field}: has valueGetter = ${typeof col.valueGetter === 'function'}`);
  });

  return resolved;
};

// ============================================
// EXAMPLE 12: Integration with AG-Grid React
// ============================================

import React from 'react';
import { AgGridReact } from 'ag-grid-react';

export const GridWithConfig = ({ rowData, collectionConfig }) => {
  // Resolve configuration
  const resolved = resolveCollectionConfigMemoized(collectionConfig);

  return (
    <div className="ag-theme-alpine" style={{ height: 600, width: '100%' }}>
      <AgGridReact
        rowData={rowData}
        columnDefs={resolved.columnDefs}
        pagination={true}
        paginationPageSize={25}
      />
    </div>
  );
};

// ============================================
// Run all examples (for testing)
// ============================================

export const runAllExamples = () => {
  console.log('=== Running Configuration System Examples ===\n');

  console.log('1. Basic Usage:');
  exampleBasicUsage();

  console.log('\n2. Custom Defaults:');
  exampleCustomDefaults();

  console.log('\n3. Field Overrides:');
  exampleFieldOverrides();

  console.log('\n4. Context-Based:');
  exampleContextBased();

  console.log('\n5. Memoized Resolver:');
  exampleMemoizedResolver();

  console.log('\n6. Batch Resolution:');
  exampleBatchResolution();

  console.log('\n7. Config Diff:');
  exampleConfigDiff();

  console.log('\n8. Export Config:');
  exampleExportConfig();

  console.log('\n9. Custom Preset:');
  exampleCustomPreset();

  console.log('\n10. Validation:');
  exampleValidation();

  console.log('\n11. Nested Fields:');
  exampleNestedFields();

  console.log('\n=== All Examples Completed ===');
};

// Export all examples
export default {
  exampleBasicUsage,
  exampleCustomDefaults,
  exampleFieldOverrides,
  exampleContextBased,
  exampleMemoizedResolver,
  exampleBatchResolution,
  exampleConfigDiff,
  exampleExportConfig,
  exampleCustomPreset,
  exampleValidation,
  exampleNestedFields,
  GridWithConfig,
  runAllExamples
};
