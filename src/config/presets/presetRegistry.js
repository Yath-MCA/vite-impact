/**
 * Preset Registry Manager
 * 
 * Central registry for reusable field type presets.
 * Eliminates repetitive field configuration across collections.
 */

import { memoize } from '../utils/memoize';

/**
 * Unique Format Configuration Registry
 * Define all reusable field type presets here
 */
export const UNIQUE_FORMAT_CONFIG = {
  // ==================== STRING TYPES ====================
  
  'string-format-1': {
    baseType: 'string',
    dataType: 'string',
    filter: 'agTextColumnFilter',
    filterParams: {
      filterOptions: ['contains', 'notContains', 'startsWith', 'endsWith'],
      defaultOption: 'contains',
      debounceMs: 500
    },
    sortable: true,
    resizable: true,
    minWidth: 120,
    flex: 1
  },

  'string-identifier': {
    baseType: 'string',
    dataType: 'string',
    filter: 'agTextColumnFilter',
    filterParams: {
      filterOptions: ['contains', 'equals', 'startsWith'],
      defaultOption: 'contains'
    },
    sortable: true,
    minWidth: 150,
    flex: 1.2
  },

  'string-title': {
    baseType: 'string',
    dataType: 'string',
    filter: 'agTextColumnFilter',
    filterParams: {
      filterOptions: ['contains', 'notContains'],
      defaultOption: 'contains',
      debounceMs: 500
    },
    sortable: true,
    minWidth: 200,
    flex: 2,
    wrapText: false,
    cellRenderer: 'truncateRenderer'
  },

  'string-badge': {
    baseType: 'string',
    dataType: 'string',
    displayType: 'badge',
    filter: 'agSetColumnFilter',
    filterParams: {
      applyMiniFilterWhileTyping: true
    },
    sortable: true,
    minWidth: 130,
    cellRenderer: 'badgeRenderer',
    cellStyle: { textAlign: 'center' }
  },

  // ==================== DATE/TIME TYPES ====================
  
  'date-format-1': {
    baseType: 'date',
    dataType: 'isodate',
    displayType: 'datetime',
    format: 'DD-MMM-YYYY HH:mm',
    filter: 'agDateColumnFilter',
    filterParams: {
      filterOptions: ['equals', 'notEqual', 'lessThan', 'lessThanOrEqual', 'greaterThan', 'greaterThanOrEqual', 'inRange'],
      defaultOption: 'equals',
      browserDatePicker: true
    },
    valueFormatter: 'isoDateFormatter',
    comparator: 'isoDateComparator',
    sortable: true,
    minWidth: 160
  },

  'date-only': {
    baseType: 'date',
    dataType: 'isodate',
    displayType: 'date',
    format: 'DD-MMM-YYYY',
    filter: 'agDateColumnFilter',
    filterParams: {
      filterOptions: ['equals', 'notEqual', 'lessThan', 'greaterThan', 'inRange'],
      defaultOption: 'equals',
      browserDatePicker: true
    },
    valueFormatter: 'dateOnlyFormatter',
    comparator: 'isoDateComparator',
    sortable: true,
    minWidth: 140
  },

  'timestamp-seconds': {
    baseType: 'date',
    dataType: 'timestamp',
    displayType: 'datetime',
    format: 'DD-MMM-YYYY HH:mm',
    filter: 'agNumberColumnFilter',
    valueFormatter: 'timestampFormatter',
    comparator: 'timestampComparator',
    sortable: true,
    minWidth: 160
  },

  // ==================== NUMBER TYPES ====================
  
  'number-integer': {
    baseType: 'number',
    dataType: 'number',
    filter: 'agNumberColumnFilter',
    filterParams: {
      filterOptions: ['equals', 'notEqual', 'lessThan', 'lessThanOrEqual', 'greaterThan', 'greaterThanOrEqual', 'inRange'],
      defaultOption: 'equals'
    },
    sortable: true,
    type: 'numericColumn',
    cellStyle: { textAlign: 'right' },
    minWidth: 100
  },

  'number-order': {
    baseType: 'number',
    dataType: 'number',
    filter: 'agNumberColumnFilter',
    filterParams: {
      filterOptions: ['equals', 'notEqual', 'lessThan', 'greaterThan', 'inRange'],
      defaultOption: 'equals'
    },
    sortable: true,
    type: 'numericColumn',
    cellStyle: { textAlign: 'center' },
    minWidth: 90
  },

  // ==================== ARRAY TYPES ====================
  
  'array-chip': {
    baseType: 'array',
    dataType: 'array',
    displayType: 'chip-list',
    filter: 'agTextColumnFilter',
    sortable: false,
    minWidth: 180,
    cellRenderer: 'chipListRenderer',
    wrapText: true,
    autoHeight: true
  },

  'array-comma': {
    baseType: 'array',
    dataType: 'array',
    displayType: 'comma-separated',
    filter: 'agTextColumnFilter',
    sortable: false,
    minWidth: 200,
    valueFormatter: 'arrayFormatter',
    tooltipField: true
  },

  'array-roles': {
    baseType: 'array',
    dataType: 'array',
    displayType: 'roles-list',
    filter: 'agSetColumnFilter',
    filterParams: {
      applyMiniFilterWhileTyping: true
    },
    sortable: false,
    minWidth: 200,
    valueFormatter: 'allRolesFormatter',
    cellRenderer: 'rolesRenderer'
  },

  // ==================== BOOLEAN TYPES ====================
  
  'boolean-icon': {
    baseType: 'boolean',
    dataType: 'boolean',
    displayType: 'icon',
    filter: 'agSetColumnFilter',
    filterParams: {
      values: [true, false]
    },
    sortable: true,
    minWidth: 80,
    cellRenderer: 'booleanIconRenderer',
    cellStyle: { textAlign: 'center' }
  },

  'boolean-badge': {
    baseType: 'boolean',
    dataType: 'boolean',
    displayType: 'badge',
    filter: 'agSetColumnFilter',
    filterParams: {
      values: [true, false]
    },
    sortable: true,
    minWidth: 100,
    cellRenderer: 'booleanBadgeRenderer'
  },

  // ==================== OBJECT/NESTED TYPES ====================
  
  'nested-string': {
    baseType: 'object',
    dataType: 'nested',
    filter: 'agTextColumnFilter',
    sortable: true,
    minWidth: 150,
    valueGetter: true,
    flex: 1
  },

  'nested-role': {
    baseType: 'object',
    dataType: 'nested',
    displayType: 'role-name',
    filter: 'agSetColumnFilter',
    filterParams: {
      applyMiniFilterWhileTyping: true
    },
    sortable: true,
    minWidth: 150,
    valueGetter: true,
    valueFormatter: 'roleNameFormatter'
  },

  // ==================== SPECIAL TYPES ====================
  
  'mongo-id': {
    baseType: 'string',
    dataType: 'string',
    filter: 'agTextColumnFilter',
    sortable: true,
    minWidth: 220,
    hide: true,
    suppressColumnsToolPanel: false
  },

  'file-size': {
    baseType: 'number',
    dataType: 'number',
    displayType: 'file-size',
    filter: 'agNumberColumnFilter',
    sortable: true,
    minWidth: 120,
    valueFormatter: 'fileSizeFormatter',
    cellStyle: { textAlign: 'right' }
  },

  'email': {
    baseType: 'string',
    dataType: 'string',
    filter: 'agTextColumnFilter',
    sortable: true,
    minWidth: 200,
    cellRenderer: 'emailRenderer'
  },

  'url': {
    baseType: 'string',
    dataType: 'string',
    filter: 'agTextColumnFilter',
    sortable: true,
    minWidth: 250,
    cellRenderer: 'linkRenderer'
  },

  'color-hex': {
    baseType: 'string',
    dataType: 'string',
    filter: 'agTextColumnFilter',
    sortable: true,
    minWidth: 100,
    cellRenderer: 'colorRenderer'
  }
};

/**
 * Preset Registry Class
 * Manages preset registration, retrieval, and validation
 */
class PresetRegistry {
  constructor() {
    this.presets = { ...UNIQUE_FORMAT_CONFIG };
    this.customPresets = new Map();
  }

  /**
   * Register a new preset
   * @param {string} presetId - Unique preset identifier
   * @param {Object} config - Preset configuration
   * @param {boolean} overwrite - Whether to overwrite existing preset
   * @returns {boolean} Success status
   */
  register(presetId, config, overwrite = false) {
    if (this.presets[presetId] && !overwrite) {
      console.warn(`Preset '${presetId}' already exists. Use overwrite=true to replace.`);
      return false;
    }

    // Validate preset configuration
    const validation = this.validatePreset(config);
    if (!validation.valid) {
      console.error(`Invalid preset '${presetId}':`, validation.errors);
      return false;
    }

    this.presets[presetId] = {
      ...config,
      _registeredAt: new Date().toISOString()
    };

    return true;
  }

  /**
   * Get a preset by ID
   * @param {string} presetId - Preset identifier
   * @returns {Object|null} Preset configuration or null
   */
  get(presetId) {
    return this.presets[presetId] ? { ...this.presets[presetId] } : null;
  }

  /**
   * Check if preset exists
   * @param {string} presetId - Preset identifier
   * @returns {boolean} Exists status
   */
  has(presetId) {
    return !!this.presets[presetId];
  }

  /**
   * Get all preset IDs
   * @returns {Array} Array of preset IDs
   */
  getAllIds() {
    return Object.keys(this.presets);
  }

  /**
   * Get presets by base type
   * @param {string} baseType - Base type to filter by
   * @returns {Object} Presets matching base type
   */
  getByBaseType(baseType) {
    return Object.entries(this.presets)
      .filter(([_, config]) => config.baseType === baseType)
      .reduce((acc, [id, config]) => {
        acc[id] = config;
        return acc;
      }, {});
  }

  /**
   * Validate preset configuration
   * @param {Object} config - Preset configuration to validate
   * @returns {Object} Validation result
   */
  validatePreset(config) {
    const errors = [];
    const required = ['baseType'];

    required.forEach(field => {
      if (!config[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    });

    const validBaseTypes = ['string', 'number', 'date', 'boolean', 'array', 'object'];
    if (config.baseType && !validBaseTypes.includes(config.baseType)) {
      errors.push(`Invalid baseType. Must be one of: ${validBaseTypes.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Remove a preset
   * @param {string} presetId - Preset identifier to remove
   * @returns {boolean} Success status
   */
  remove(presetId) {
    if (!this.presets[presetId]) {
      return false;
    }

    delete this.presets[presetId];
    return true;
  }

  /**
   * Get preset metadata
   * @returns {Object} Registry metadata
   */
  getMetadata() {
    const baseTypes = {};
    
    Object.values(this.presets).forEach(preset => {
      baseTypes[preset.baseType] = (baseTypes[preset.baseType] || 0) + 1;
    });

    return {
      totalPresets: Object.keys(this.presets).length,
      baseTypes,
      presetIds: this.getAllIds()
    };
  }
}

// Create singleton instance
export const presetRegistry = new PresetRegistry();

/**
 * Memoized preset getter for performance
 */
export const getPreset = memoize(
  (presetId) => presetRegistry.get(presetId),
  (presetId) => presetId
);

/**
 * Get preset with inheritance resolution
 * Supports preset extending other presets
 * @param {string} presetId - Preset identifier
 * @param {Object} customRegistry - Optional custom registry
 * @returns {Object} Resolved preset configuration
 */
export const getPresetWithInheritance = (presetId, customRegistry = null) => {
  const registry = customRegistry || presetRegistry;
  const preset = registry.get(presetId);
  
  if (!preset) {
    return null;
  }

  // If preset extends another preset, merge them
  if (preset.extends) {
    const parentPreset = getPresetWithInheritance(preset.extends, registry);
    if (parentPreset) {
      return deepMergePresets(parentPreset, preset);
    }
  }

  return preset;
};

/**
 * Deep merge two preset configurations
 * Child values override parent values
 * @param {Object} parent - Parent preset
 * @param {Object} child - Child preset
 * @returns {Object} Merged preset
 */
const deepMergePresets = (parent, child) => {
  const merged = { ...parent };
  
  Object.keys(child).forEach(key => {
    if (key === 'extends') {
      return; // Skip extends property
    }
    
    if (key === 'filterParams' && parent.filterParams) {
      merged[key] = { ...parent.filterParams, ...child.filterParams };
    } else if (key === 'cellStyle' && parent.cellStyle) {
      merged[key] = { ...parent.cellStyle, ...child.cellStyle };
    } else {
      merged[key] = child[key];
    }
  });

  return merged;
};

export default presetRegistry;
