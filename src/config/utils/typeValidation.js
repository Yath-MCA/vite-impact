/**
 * Type Validation Engine
 * 
 * Validates configuration types, field definitions, and resolved configurations.
 * Ensures data integrity and catches configuration errors early.
 */

import { UNIQUE_FORMAT_CONFIG } from '../presets/presetRegistry';

/**
 * Validation result structure
 */
const createValidationResult = (valid = true, errors = [], warnings = []) => ({
  valid,
  errors,
  warnings
});

/**
 * Valid base types for fields
 */
const VALID_BASE_TYPES = ['string', 'number', 'date', 'boolean', 'array', 'object', 'mixed'];

/**
 * Valid filter types
 */
const VALID_FILTER_TYPES = [
  'agTextColumnFilter',
  'agNumberColumnFilter',
  'agDateColumnFilter',
  'agSetColumnFilter',
  null,
  undefined
];

/**
 * Valid display types
 */
const VALID_DISPLAY_TYPES = [
  'text', 'badge', 'datetime', 'date', 'time', 'chip-list',
  'comma-separated', 'roles-list', 'icon', 'file-size',
  'email', 'link', 'color', 'role-name', undefined
];

/**
 * Schema for field configuration validation
 */
const FIELD_CONFIG_SCHEMA = {
  required: ['field'],
  optional: [
    'type', 'displayType', 'title', 'width', 'minWidth', 'maxWidth',
    'flex', 'hide', 'pinned', 'sortable', 'resizable', 'filter',
    'filterParams', 'cellRenderer', 'cellStyle', 'valueFormatter',
    'valueGetter', 'comparator', 'tooltipField', 'headerName',
    'suppressMenu', 'suppressColumnsToolPanel', 'autoHeight',
    'wrapText', 'editable', 'cellEditor', 'cellEditorParams',
    'valueSetter', 'valueParser', 'keyCreator', 'sort', 'sortIndex',
    'unSortIcon', 'icons', 'onCellValueChanged', 'rowDrag', 'dndSource',
    'checkboxSelection', 'headerCheckboxSelection', 'showDisabledCheckboxes'
  ],
  types: {
    field: 'string',
    type: 'string',
    displayType: 'string',
    title: 'string',
    width: 'number',
    minWidth: 'number',
    maxWidth: 'number',
    flex: 'number',
    hide: 'boolean',
    pinned: ['string', 'boolean'],
    sortable: 'boolean',
    resizable: 'boolean',
    filter: ['string', 'null'],
    suppressMenu: 'boolean',
    suppressColumnsToolPanel: 'boolean',
    autoHeight: 'boolean',
    wrapText: 'boolean',
    editable: 'boolean',
    rowDrag: 'boolean',
    dndSource: 'boolean',
    checkboxSelection: 'boolean',
    headerCheckboxSelection: 'boolean',
    showDisabledCheckboxes: 'boolean'
  }
};

/**
 * Validate type of a value
 * @param {*} value - Value to validate
 * @param {string|Array} expectedType - Expected type(s)
 * @returns {boolean} Whether type is valid
 */
const validateType = (value, expectedType) => {
  if (value === null || value === undefined) {
    return true; // Null/undefined are valid for any type
  }

  const actualType = Array.isArray(value) ? 'array' : typeof value;

  if (Array.isArray(expectedType)) {
    return expectedType.includes(actualType);
  }

  return actualType === expectedType;
};

/**
 * Validate preset ID exists
 * @param {string} presetId - Preset identifier
 * @returns {Object} Validation result
 */
export const validatePresetId = (presetId) => {
  const errors = [];

  if (!presetId) {
    errors.push('Preset ID is required');
    return createValidationResult(false, errors);
  }

  if (typeof presetId !== 'string') {
    errors.push('Preset ID must be a string');
    return createValidationResult(false, errors);
  }

  if (!UNIQUE_FORMAT_CONFIG[presetId]) {
    errors.push(`Unknown preset ID: '${presetId}'. Available presets: ${Object.keys(UNIQUE_FORMAT_CONFIG).join(', ')}`);
    return createValidationResult(false, errors);
  }

  return createValidationResult(true);
};

/**
 * Validate field configuration
 * @param {Object} fieldConfig - Field configuration
 * @param {number} index - Field index (for error messages)
 * @returns {Object} Validation result
 */
export const validateFieldConfig = (fieldConfig, index = null) => {
  const errors = [];
  const warnings = [];
  const prefix = index !== null ? `Field ${index}: ` : '';

  // Check if fieldConfig is an object
  if (!fieldConfig || typeof fieldConfig !== 'object') {
    errors.push(`${prefix}Field configuration must be an object`);
    return createValidationResult(false, errors);
  }

  // Check required fields
  FIELD_CONFIG_SCHEMA.required.forEach(field => {
    if (!(field in fieldConfig)) {
      errors.push(`${prefix}Missing required field: '${field}'`);
    }
  });

  // Check field name is string
  if ('field' in fieldConfig && typeof fieldConfig.field !== 'string') {
    errors.push(`${prefix}Field 'field' must be a string`);
  }

  // Validate field name format (allow dot notation for nested fields)
  if (fieldConfig.field && typeof fieldConfig.field === 'string') {
    const fieldNamePattern = /^[a-zA-Z_][a-zA-Z0-9_.]*$/;
    if (!fieldNamePattern.test(fieldConfig.field)) {
      errors.push(`${prefix}Invalid field name: '${fieldConfig.field}'. Must start with letter/underscore, contain only alphanumeric, underscore, or dot`);
    }
  }

  // Validate type if provided
  if (fieldConfig.type) {
    const presetValidation = validatePresetId(fieldConfig.type);
    if (!presetValidation.valid) {
      errors.push(`${prefix}${presetValidation.errors[0]}`);
    }
  }

  // Validate displayType if provided
  if (fieldConfig.displayType && !VALID_DISPLAY_TYPES.includes(fieldConfig.displayType)) {
    warnings.push(`${prefix}Unusual displayType: '${fieldConfig.displayType}'. Standard types: ${VALID_DISPLAY_TYPES.filter(Boolean).join(', ')}`);
  }

  // Validate filter type if provided
  if (fieldConfig.filter && !VALID_FILTER_TYPES.includes(fieldConfig.filter)) {
    warnings.push(`${prefix}Custom filter type: '${fieldConfig.filter}'`);
  }

  // Validate numeric fields
  ['width', 'minWidth', 'maxWidth', 'flex'].forEach(prop => {
    if (prop in fieldConfig) {
      if (typeof fieldConfig[prop] !== 'number' || fieldConfig[prop] < 0) {
        errors.push(`${prefix}'${prop}' must be a positive number`);
      }
    }
  });

  // Validate boolean fields
  ['hide', 'sortable', 'resizable', 'editable', 'autoHeight', 'wrapText'].forEach(prop => {
    if (prop in fieldConfig && typeof fieldConfig[prop] !== 'boolean') {
      errors.push(`${prefix}'${prop}' must be a boolean`);
    }
  });

  // Validate pinned value
  if ('pinned' in fieldConfig) {
    const validPinned = ['left', 'right', true, false, null, undefined];
    if (!validPinned.includes(fieldConfig.pinned)) {
      errors.push(`${prefix}'pinned' must be 'left', 'right', true, false, or null`);
    }
  }

  // Validate sort value
  if ('sort' in fieldConfig) {
    const validSort = ['asc', 'desc', null, undefined];
    if (!validSort.includes(fieldConfig.sort)) {
      errors.push(`${prefix}'sort' must be 'asc', 'desc', or null`);
    }
  }

  // Warn about unknown properties
  const knownProps = [...FIELD_CONFIG_SCHEMA.required, ...FIELD_CONFIG_SCHEMA.optional];
  Object.keys(fieldConfig).forEach(key => {
    if (!knownProps.includes(key)) {
      warnings.push(`${prefix}Unknown property: '${key}'. This will be passed through to AG-Grid.`);
    }
  });

  return createValidationResult(errors.length === 0, errors, warnings);
};

/**
 * Validate collection configuration
 * @param {Object} collectionConfig - Collection configuration
 * @returns {Object} Validation result
 */
export const validateCollectionConfig = (collectionConfig) => {
  const errors = [];
  const warnings = [];

  // Check collection config is an object
  if (!collectionConfig || typeof collectionConfig !== 'object') {
    errors.push('Collection configuration must be an object');
    return createValidationResult(false, errors);
  }

  // Check collection name
  if (!collectionConfig.collection) {
    errors.push("Missing required field: 'collection'");
  } else if (typeof collectionConfig.collection !== 'string') {
    errors.push("'collection' must be a string");
  }

  // Check fields array
  if (!collectionConfig.fields) {
    errors.push("Missing required field: 'fields'");
  } else if (!Array.isArray(collectionConfig.fields)) {
    errors.push("'fields' must be an array");
  } else if (collectionConfig.fields.length === 0) {
    warnings.push("'fields' array is empty. No columns will be generated.");
  } else {
    // Validate each field
    collectionConfig.fields.forEach((field, index) => {
      const fieldValidation = validateFieldConfig(field, index);
      if (!fieldValidation.valid) {
        errors.push(...fieldValidation.errors);
      }
      if (fieldValidation.warnings.length > 0) {
        warnings.push(...fieldValidation.warnings);
      }
    });

    // Check for duplicate field names
    const fieldNames = collectionConfig.fields.map(f => f.field);
    const duplicates = fieldNames.filter((item, index) => fieldNames.indexOf(item) !== index);
    if (duplicates.length > 0) {
      errors.push(`Duplicate field names found: ${[...new Set(duplicates)].join(', ')}`);
    }
  }

  // Validate context if provided
  if (collectionConfig.context && typeof collectionConfig.context !== 'object') {
    errors.push("'context' must be an object");
  }

  return createValidationResult(errors.length === 0, errors, warnings);
};

/**
 * Validate global defaults configuration
 * @param {Object} globalDefaults - Global defaults configuration
 * @returns {Object} Validation result
 */
export const validateGlobalDefaults = (globalDefaults) => {
  const errors = [];
  const warnings = [];

  if (!globalDefaults || typeof globalDefaults !== 'object') {
    errors.push('Global defaults must be an object');
    return createValidationResult(false, errors);
  }

  // Validate known properties
  const validProperties = [
    'sortable', 'resizable', 'filter', 'editable', 'minWidth', 'flex',
    'floatingFilter', 'suppressMenu', 'unSortIcon'
  ];

  Object.keys(globalDefaults).forEach(key => {
    if (!validProperties.includes(key)) {
      warnings.push(`Global default '${key}' is not a standard AG-Grid property`);
    }
  });

  return createValidationResult(errors.length === 0, errors, warnings);
};

/**
 * Validate resolved column definition
 * @param {Object} columnDef - Resolved column definition
 * @returns {Object} Validation result
 */
export const validateColumnDefinition = (columnDef) => {
  const errors = [];
  const warnings = [];

  if (!columnDef || typeof columnDef !== 'object') {
    errors.push('Column definition must be an object');
    return createValidationResult(false, errors);
  }

  // Check required column properties
  if (!columnDef.field && !columnDef.colId) {
    warnings.push('Column definition should have either "field" or "colId"');
  }

  if (!columnDef.headerName && !columnDef.headerValueGetter) {
    warnings.push('Column definition should have "headerName" or "headerValueGetter"');
  }

  // Validate filter if present
  if (columnDef.filter && !VALID_FILTER_TYPES.includes(columnDef.filter)) {
    warnings.push(`Non-standard filter type: '${columnDef.filter}'`);
  }

  // Validate cell renderer references
  if (columnDef.cellRenderer && typeof columnDef.cellRenderer === 'string') {
    const validRenderers = [
      'badgeRenderer', 'chipListRenderer', 'booleanIconRenderer',
      'truncateRenderer', 'linkRenderer', 'emailRenderer',
      'colorRenderer', 'rolesRenderer'
    ];
    if (!validRenderers.includes(columnDef.cellRenderer)) {
      warnings.push(`Custom cell renderer: '${columnDef.cellRenderer}'. Ensure this renderer is registered.`);
    }
  }

  // Validate value formatter references
  if (columnDef.valueFormatter && typeof columnDef.valueFormatter === 'string') {
    const validFormatters = [
      'isoDateFormatter', 'timestampFormatter', 'dateOnlyFormatter',
      'arrayFormatter', 'allRolesFormatter', 'roleNameFormatter',
      'fileSizeFormatter'
    ];
    if (!validFormatters.includes(columnDef.valueFormatter)) {
      warnings.push(`Custom value formatter: '${columnDef.valueFormatter}'. Ensure this formatter is registered.`);
    }
  }

  return createValidationResult(errors.length === 0, errors, warnings);
};

/**
 * Validate complete configuration system
 * @param {Object} config - Complete configuration
 * @returns {Object} Validation result with detailed breakdown
 */
export const validateConfiguration = (config) => {
  const result = {
    valid: true,
    collection: null,
    globalDefaults: null,
    fields: [],
    errors: [],
    warnings: []
  };

  // Validate global defaults
  if (config.globalDefaults) {
    const globalValidation = validateGlobalDefaults(config.globalDefaults);
    result.globalDefaults = globalValidation;
    if (!globalValidation.valid) {
      result.valid = false;
      result.errors.push(...globalValidation.errors.map(e => `Global: ${e}`));
    }
    result.warnings.push(...globalValidation.warnings.map(w => `Global: ${w}`));
  }

  // Validate collection config
  const collectionValidation = validateCollectionConfig(config);
  result.collection = collectionValidation;
  if (!collectionValidation.valid) {
    result.valid = false;
    result.errors.push(...collectionValidation.errors);
  }
  result.warnings.push(...collectionValidation.warnings);

  return result;
};

/**
 * Throw validation errors if invalid
 * @param {Object} validation - Validation result
 * @param {boolean} throwOnWarning - Whether to throw on warnings too
 */
export const assertValid = (validation, throwOnWarning = false) => {
  if (!validation.valid) {
    const errorMessage = validation.errors.join('\n');
    throw new Error(`Configuration validation failed:\n${errorMessage}`);
  }

  if (throwOnWarning && validation.warnings && validation.warnings.length > 0) {
    const warningMessage = validation.warnings.join('\n');
    console.warn(`Configuration warnings:\n${warningMessage}`);
  }
};

export default {
  validatePresetId,
  validateFieldConfig,
  validateCollectionConfig,
  validateGlobalDefaults,
  validateColumnDefinition,
  validateConfiguration,
  assertValid
};
