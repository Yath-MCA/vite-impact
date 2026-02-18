/**
 * Date Utilities for AG-Grid
 * Handles ISODate and timestamp formatting with moment.js
 */

import moment from 'moment';

// Default date format for display
export const DEFAULT_DATE_FORMAT = 'DD-MMM-YYYY HH:mm';
export const DISPLAY_DATE_FORMAT = 'DD-MMM-YYYY';
export const DISPLAY_TIME_FORMAT = 'HH:mm';

/**
 * Format ISODate string to display format
 * @param {string|Date} isoDate - ISODate string or Date object
 * @param {string} format - Optional custom format
 * @returns {string} Formatted date string
 */
export const formatISODate = (isoDate, format = DEFAULT_DATE_FORMAT) => {
  if (!isoDate) return '-';
  
  const momentDate = moment(isoDate);
  if (!momentDate.isValid()) return '-';
  
  return momentDate.format(format);
};

/**
 * Format Unix timestamp (seconds) to display format
 * @param {number} timestamp - Unix timestamp in seconds
 * @param {string} format - Optional custom format
 * @returns {string} Formatted date string
 */
export const formatTimestamp = (timestamp, format = DEFAULT_DATE_FORMAT) => {
  if (!timestamp || typeof timestamp !== 'number') return '-';
  
  const momentDate = moment.unix(timestamp);
  if (!momentDate.isValid()) return '-';
  
  return momentDate.format(format);
};

/**
 * Format date for display only (no time)
 * @param {string|Date} isoDate - ISODate string or Date object
 * @returns {string} Formatted date string
 */
export const formatDateOnly = (isoDate) => {
  return formatISODate(isoDate, DISPLAY_DATE_FORMAT);
};

/**
 * Format time for display only (no date)
 * @param {string|Date} isoDate - ISODate string or Date object
 * @returns {string} Formatted time string
 */
export const formatTimeOnly = (isoDate) => {
  return formatISODate(isoDate, DISPLAY_TIME_FORMAT);
};

/**
 * Custom date comparator for AG-Grid sorting
 * Handles ISODate strings properly
 * @param {string} dateA - First date string
 * @param {string} dateB - Second date string
 * @returns {number} Comparison result
 */
export const isoDateComparator = (dateA, dateB) => {
  if (!dateA && !dateB) return 0;
  if (!dateA) return -1;
  if (!dateB) return 1;
  
  const momentA = moment(dateA);
  const momentB = moment(dateB);
  
  if (!momentA.isValid() && !momentB.isValid()) return 0;
  if (!momentA.isValid()) return -1;
  if (!momentB.isValid()) return 1;
  
  return momentA.valueOf() - momentB.valueOf();
};

/**
 * Custom timestamp comparator for AG-Grid sorting
 * @param {number} timeA - First timestamp
 * @param {number} timeB - Second timestamp
 * @returns {number} Comparison result
 */
export const timestampComparator = (timeA, timeB) => {
  if (!timeA && !timeB) return 0;
  if (!timeA) return -1;
  if (!timeB) return 1;
  
  return timeA - timeB;
};

/**
 * Parse date string to Date object for filtering
 * @param {string} dateString - Date string to parse
 * @returns {Date|null} Parsed Date or null
 */
export const parseDateForFilter = (dateString) => {
  if (!dateString) return null;
  
  const parsed = moment(dateString, [
    'DD-MMM-YYYY',
    'YYYY-MM-DD',
    'DD/MM/YYYY',
    'MM/DD/YYYY',
    moment.ISO_8601
  ]);
  
  return parsed.isValid() ? parsed.toDate() : null;
};

/**
 * Get date filter comparator for AG-Grid
 * @returns {Function} Filter comparator function
 */
export const getDateFilterComparator = () => {
  return (filterLocalDateAtMidnight, cellValue) => {
    if (!cellValue) return -1;
    
    const cellDate = moment(cellValue);
    if (!cellDate.isValid()) return -1;
    
    const cellDateOnly = cellDate.startOf('day');
    const filterDateOnly = moment(filterLocalDateAtMidnight).startOf('day');
    
    if (cellDateOnly.isSame(filterDateOnly, 'day')) {
      return 0;
    }
    
    return cellDateOnly.isBefore(filterDateOnly) ? -1 : 1;
  };
};

/**
 * Format relative time (e.g., "2 hours ago")
 * @param {string|Date} isoDate - ISODate string or Date object
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (isoDate) => {
  if (!isoDate) return '-';
  
  const momentDate = moment(isoDate);
  if (!momentDate.isValid()) return '-';
  
  return momentDate.fromNow();
};

/**
 * Check if date is within range
 * @param {string|Date} date - Date to check
 * @param {string|Date} startDate - Start of range
 * @param {string|Date} endDate - End of range
 * @returns {boolean} Whether date is in range
 */
export const isDateInRange = (date, startDate, endDate) => {
  if (!date) return false;
  
  const momentDate = moment(date);
  if (!momentDate.isValid()) return false;
  
  const start = startDate ? moment(startDate) : null;
  const end = endDate ? moment(endDate) : null;
  
  if (start && momentDate.isBefore(start, 'day')) return false;
  if (end && momentDate.isAfter(end, 'day')) return false;
  
  return true;
};
