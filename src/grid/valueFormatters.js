/**
 * Value Formatters for AG-Grid
 * Handles data transformation and display formatting
 */

import { formatISODate, formatTimestamp } from './dateUtils';

/**
 * Safely access nested object properties
 * @param {Object} obj - Object to access
 * @param {string} path - Dot notation path (e.g., "titleinfo.doctitle")
 * @param {*} defaultValue - Default value if path not found
 * @returns {*} Value at path or default
 */
export const getNestedValue = (obj, path, defaultValue = '-') => {
  if (!obj || !path) return defaultValue;
  
  const keys = path.split('.');
  let value = obj;
  
  for (const key of keys) {
    if (value === null || value === undefined || typeof value !== 'object') {
      return defaultValue;
    }
    value = value[key];
  }
  
  return value !== null && value !== undefined ? value : defaultValue;
};

/**
 * Format status with badge styling
 * @param {Object} params - AG-Grid cell params
 * @returns {string} HTML string for status badge
 */
export const statusFormatter = (params) => {
  const status = params.value;
  if (!status) return '-';
  
  const statusLower = String(status).toLowerCase();
  
  // Status color mapping
  const statusColors = {
    'active': 'success',
    'completed': 'info',
    'pending': 'warning',
    'in-progress': 'primary',
    'draft': 'secondary',
    'review': 'info',
    'approved': 'success',
    'rejected': 'danger',
    'cancelled': 'danger',
    'archived': 'secondary',
    'signed-out': 'warning',
    'checked-out': 'primary',
    'locked': 'danger'
  };
  
  const colorClass = statusColors[statusLower] || 'secondary';
  
  return `<span class="badge bg-${colorClass}" style="font-size: 0.85em; padding: 0.35em 0.65em;">${status}</span>`;
};

/**
 * Format role name with proper capitalization
 * @param {Object} params - AG-Grid cell params
 * @returns {string} Formatted role name
 */
export const roleNameFormatter = (params) => {
  const role = params.value;
  if (!role) return '-';
  
  // Handle nested nextrole.rolename
  if (params.colDef.field === 'nextrole.rolename' && params.data?.nextrole) {
    return capitalizeWords(params.data.nextrole.rolename);
  }
  
  return capitalizeWords(role);
};

/**
 * Capitalize words in a string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
const capitalizeWords = (str) => {
  if (!str) return '-';
  
  return String(str)
    .split(/[\s_-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Format nested document title from titleinfo
 * @param {Object} params - AG-Grid cell params
 * @returns {string} Document title
 */
export const docTitleFormatter = (params) => {
  const title = getNestedValue(params.data, 'titleinfo.doctitle', '-');
  return title;
};

/**
 * Format nested author group from titleinfo
 * @param {Object} params - AG-Grid cell params
 * @returns {string} Author group
 */
export const authorGroupFormatter = (params) => {
  return getNestedValue(params.data, 'titleinfo.authorgroup', '-');
};

/**
 * Format nested identifier from titleinfo
 * @param {Object} params - AG-Grid cell params
 * @returns {string} Identifier
 */
export const identifierFormatter = (params) => {
  return getNestedValue(params.data, 'titleinfo.identifier', '-');
};

/**
 * Format nested project name from titleinfo
 * @param {Object} params - AG-Grid cell params
 * @returns {string} Project name
 */
export const projectNameFormatter = (params) => {
  return getNestedValue(params.data, 'titleinfo.projectname', '-');
};

/**
 * Format ISODate cell
 * @param {Object} params - AG-Grid cell params
 * @returns {string} Formatted date
 */
export const isoDateFormatter = (params) => {
  return formatISODate(params.value);
};

/**
 * Format timestamp cell (Unix seconds)
 * @param {Object} params - AG-Grid cell params
 * @returns {string} Formatted date
 */
export const timestampFormatter = (params) => {
  return formatTimestamp(params.value);
};

/**
 * Format boolean value
 * @param {Object} params - AG-Grid cell params
 * @returns {string} Formatted boolean
 */
export const booleanFormatter = (params) => {
  const value = params.value;
  if (value === null || value === undefined) return '-';
  
  const isTrue = value === true || value === 'true' || value === 1 || value === '1';
  
  return isTrue 
    ? '<span class="text-success"><i class="bi bi-check-circle-fill"></i> Yes</span>'
    : '<span class="text-secondary"><i class="bi bi-x-circle-fill"></i> No</span>';
};

/**
 * Format boolean as simple icon
 * @param {Object} params - AG-Grid cell params
 * @returns {string} Icon HTML
 */
export const booleanIconFormatter = (params) => {
  const value = params.value;
  if (value === null || value === undefined) return '-';
  
  const isTrue = value === true || value === 'true' || value === 1 || value === '1';
  
  return isTrue 
    ? '<span class="text-success">✓</span>'
    : '<span class="text-muted">-</span>';
};

/**
 * Format number with thousands separator
 * @param {Object} params - AG-Grid cell params
 * @returns {string} Formatted number
 */
export const numberFormatter = (params) => {
  if (params.value === null || params.value === undefined) return '-';
  
  const num = Number(params.value);
  if (isNaN(num)) return '-';
  
  return num.toLocaleString();
};

/**
 * Format file size (if applicable)
 * @param {Object} params - AG-Grid cell params
 * @returns {string} Formatted file size
 */
export const fileSizeFormatter = (params) => {
  const bytes = params.value;
  if (!bytes || isNaN(bytes)) return '-';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  if (i === 0) return bytes + ' ' + sizes[i];
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
};

/**
 * Truncate text with ellipsis
 * @param {Object} params - AG-Grid cell params
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} Truncated text
 */
export const truncateFormatter = (params, maxLength = 50) => {
  const text = params.value;
  if (!text) return '-';
  
  const str = String(text);
  if (str.length <= maxLength) return str;
  
  return str.substring(0, maxLength) + '...';
};

/**
 * Format array as comma-separated list
 * @param {Object} params - AG-Grid cell params
 * @returns {string} Formatted list
 */
export const arrayFormatter = (params) => {
  const arr = params.value;
  if (!arr || !Array.isArray(arr)) return '-';
  if (arr.length === 0) return '-';
  
  return arr.join(', ');
};

/**
 * Format allroles array
 * @param {Object} params - AG-Grid cell params
 * @returns {string} Formatted roles
 */
export const allRolesFormatter = (params) => {
  const roles = params.value;
  if (!roles || !Array.isArray(roles)) return '-';
  if (roles.length === 0) return '-';
  
  return roles.map(role => capitalizeWords(role)).join(', ');
};
