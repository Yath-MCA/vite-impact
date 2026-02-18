/**
 * Configuration Resolver
 * 
 * Resolves collection configurations by merging:
 * 1. Global defaults
 * 2. Preset configurations
 * 3. Field-level overrides
 * 4. Context-based overrides (role, client, etc.)
 * 
 * Priority: Field Override > Preset Config > Global Defaults
 */

import { presetRegistry, getPreset } from '../presets/presetRegistry';
import { deepMerge, mergeWithPriority } from '../utils/deepMerge';
import { createMemoizedResolver } from '../utils/memoize';
import {
  validateCollectionConfig,
  validateFieldConfig,
  assertValid
} from '../utils/typeValidation';

/**
 * Default global configuration
 */
export const DEFAULT_GLOBAL_CONFIG = {
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
};

/**
 * Context override rules
 * Define how context (role, client) affects configuration
 */
const CONTEXT_OVERRIDE_RULES = {
  // Role-based visibility overrides
  roleVisibility: {
    admin: {
      showInternalIds: true,
      showSystemFields: true
    },
    editor: {
      showInternalIds: false,
      showSystemFields: false
    },
    viewer: {
      showInternalIds: false,
      showSystemFields: false,
      editable: false
    }
  },

  // Client-based field overrides
  clientFields: {
    // Example: Client A sees additional columns
    'client-a': {
      additionalFields: ['customField1', 'customField2'],
      hideFields: ['internalNotes']
    }
  }
};

/**
 * Generate header name from field name
 * @param {string} fieldName - Field name
 * @returns {string} Formatted header name
 */
const generateHeaderName = (fieldName) => {
  if (!fieldName) return '';

  // Handle nested fields (e.g., "titleinfo.doctitle")
  const parts = fieldName.split('.');
  const lastPart = parts[parts.length - 1];

  // Convert camelCase/snake_case to Title Case
  return lastPart
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^./, str => str.toUpperCase())
    .trim();
};

/**
 * Generate colId from field name
 * Ensures unique column IDs for nested fields
 * @param {string} fieldName - Field name
 * @returns {string} Column ID
 */
const generateColId = (fieldName) => {
  if (!fieldName) return '';
  return fieldName.replace(/\./g, '_');
};

/**
 * Create value getter for nested fields
 * @param {string} fieldPath - Dot-notation field path
 * @returns {Function} Value getter function
 */
const createNestedValueGetter = (fieldPath) => {
  return (params) => {
    if (!params.data || !fieldPath) return null;

    const keys = fieldPath.split('.');
    let value = params.data;

    for (const key of keys) {
      if (value === null || value === undefined || typeof value !== 'object') {
        return null;
      }
      value = value[key];
    }

    return value;
  };
};

/**
 * Resolve field configuration
 * Merges preset with field overrides
 * @param {Object} fieldConfig - Field configuration from collection
 * @param {Object} globalDefaults - Global defaults
 * @returns {Object} Resolved field configuration
 */
const resolveField = (fieldConfig, globalDefaults = {}) => {
  const { field, type, ...fieldOverrides } = fieldConfig;

  // Start with global defaults
  let resolved = { ...globalDefaults };

  // Apply preset if specified
  if (type) {
    const preset = getPreset(type);
    if (preset) {
      resolved = mergeWithPriority(resolved, preset, {});
    }
  }

  // Apply field-level overrides (highest priority)
  resolved = mergeWithPriority(resolved, {}, fieldOverrides);

  // Set essential properties
  resolved.field = field;
  resolved.colId = fieldOverrides.colId || generateColId(field);
  resolved.headerName = fieldOverrides.title || fieldOverrides.headerName || generateHeaderName(field);

  // Add value getter for nested fields
  if (field.includes('.') && !resolved.valueGetter && !fieldOverrides.valueGetter) {
    resolved.valueGetter = createNestedValueGetter(field);
  }

  return resolved;
};

/**
 * Apply context-based overrides
 * @param {Array} columnDefs - Resolved column definitions
 * @param {Object} context - Context object (role, client, etc.)
 * @returns {Array} Modified column definitions
 */
const applyContextOverrides = (columnDefs, context = {}) => {
  if (!context || Object.keys(context).length === 0) {
    return columnDefs;
  }

  const { role, client, userId } = context;
  let modified = [...columnDefs];

  // Apply role-based overrides
  if (role && CONTEXT_OVERRIDE_RULES.roleVisibility[role]) {
    const roleConfig = CONTEXT_OVERRIDE_RULES.roleVisibility[role];
    
    modified = modified.map(col => {
      // Check if column should be hidden for this role
      if (roleConfig.showInternalIds === false && isInternalField(col.field)) {
        return { ...col, hide: true };
      }
      
      // Check if column should be non-editable
      if (roleConfig.editable === false) {
        return { ...col, editable: false };
      }

      return col;
    });
  }

  // Apply client-based overrides
  if (client && CONTEXT_OVERRIDE_RULES.clientFields[client]) {
    const clientConfig = CONTEXT_OVERRIDE_RULES.clientFields[client];

    // Hide specific fields for this client
    if (clientConfig.hideFields) {
      modified = modified.map(col => {
        if (clientConfig.hideFields.includes(col.field)) {
          return { ...col, hide: true };
        }
        return col;
      });
    }
  }

  return modified;
};

/**
 * Check if field is internal/system field
 * @param {string} fieldName - Field name
 * @returns {boolean} Whether field is internal
 */
const isInternalField = (fieldName) => {
  const internalPatterns = [
    /^_id$/,
    /docid$/i,
    /fileid$/i,
    /^dtd$/i,
    /internal/i,
    /system/i
  ];

  return internalPatterns.some(pattern => pattern.test(fieldName));
};

/**
 * Resolve collection configuration to column definitions
 * Main resolution function
 * @param {Object} collectionConfig - Collection configuration
 * @param {Object} options - Resolution options
 * @returns {Object} Resolved configuration with column definitions
 */
export const resolveCollectionConfig = (collectionConfig, options = {}) => {
  const {
    globalDefaults = DEFAULT_GLOBAL_CONFIG,
    validate = true,
    applyContext = true
  } = options;

  // Validate configuration if requested
  if (validate) {
    const validation = validateCollectionConfig(collectionConfig);
    assertValid(validation);
  }

  const { collection, fields, context = {} } = collectionConfig;

  // Resolve each field
  const columnDefs = fields.map(fieldConfig => {
    // Validate individual field
    if (validate) {
      const fieldValidation = validateFieldConfig(fieldConfig);
      assertValid(fieldValidation);
    }

    return resolveField(fieldConfig, globalDefaults);
  });

  // Apply context overrides
  const finalColumnDefs = applyContext && context
    ? applyContextOverrides(columnDefs, context)
    : columnDefs;

  return {
    collection,
    columnDefs: finalColumnDefs,
    context,
    metadata: {
      totalColumns: finalColumnDefs.length,
      visibleColumns: finalColumnDefs.filter(col => !col.hide).length,
      resolvedAt: new Date().toISOString()
    }
  };
};

/**
 * Create memoized version of resolver
 * Caches resolved configurations for performance
 */
export const resolveCollectionConfigMemoized = createMemoizedResolver(
  resolveCollectionConfig
);

/**
 * Batch resolve multiple collection configurations
 * @param {Array} configs - Array of collection configurations
 * @param {Object} options - Resolution options
 * @returns {Array} Array of resolved configurations
 */
export const resolveMultipleCollections = (configs, options = {}) => {
  return configs.map(config => resolveCollectionConfig(config, options));
};

/**
 * Get configuration diff
 * Compare two configurations and return differences
 * @param {Object} config1 - First configuration
 * @param {Object} config2 - Second configuration
 * @returns {Object} Differences
 */
export const getConfigDiff = (config1, config2) => {
  const diff = {
    added: [],
    removed: [],
    modified: []
  };

  const fields1 = new Map(config1.fields?.map(f => [f.field, f]) || []);
  const fields2 = new Map(config2.fields?.map(f => [f.field, f]) || []);

  // Find added fields
  fields2.forEach((field, key) => {
    if (!fields1.has(key)) {
      diff.added.push(key);
    }
  });

  // Find removed fields
  fields1.forEach((field, key) => {
    if (!fields2.has(key)) {
      diff.removed.push(key);
    }
  });

  // Find modified fields
  fields1.forEach((field1, key) => {
    if (fields2.has(key)) {
      const field2 = fields2.get(key);
      if (JSON.stringify(field1) !== JSON.stringify(field2)) {
        diff.modified.push(key);
      }
    }
  });

  return diff;
};

/**
 * Export configuration to JSON
 * @param {Object} resolvedConfig - Resolved configuration
 * @returns {string} JSON string
 */
export const exportConfigToJSON = (resolvedConfig) => {
  return JSON.stringify(resolvedConfig, (key, value) => {
    // Handle functions - convert to string identifiers
    if (typeof value === 'function') {
      return `[Function: ${value.name || 'anonymous'}]`;
    }
    return value;
  }, 2);
};

export default {
  resolveCollectionConfig,
  resolveCollectionConfigMemoized,
  resolveMultipleCollections,
  getConfigDiff,
  exportConfigToJSON,
  DEFAULT_GLOBAL_CONFIG
};
