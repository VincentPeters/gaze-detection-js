/**
 * Date Formatting Utilities
 *
 * This module provides utilities for formatting dates.
 */

/**
 * Format a date to a string representation
 *
 * @param {Date|string|number} date - The date to format
 * @param {Object} [options] - Formatting options
 * @param {string} [options.format='medium'] - Format type: 'short', 'medium', 'long', 'full'
 * @param {boolean} [options.includeTime=false] - Whether to include time
 * @param {string} [options.locale='en-US'] - The locale to use for formatting
 * @returns {string} The formatted date string
 */
export function formatDate(date, options = {}) {
  const {
    format = 'medium',
    includeTime = false,
    locale = 'en-US'
  } = options;

  // Convert to Date object if string or number
  const dateObj = date instanceof Date ? date : new Date(date);

  // Handle invalid dates
  if (isNaN(dateObj.getTime())) {
    console.error('Invalid date provided to formatDate:', date);
    return 'Invalid date';
  }

  // Define date formatting options
  const dateFormatOptions = {
    short: { year: 'numeric', month: 'numeric', day: 'numeric' },
    medium: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric' },
    full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  };

  // Add time options if requested
  const formatOptions = {
    ...dateFormatOptions[format],
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {})
  };

  // Format the date
  return new Intl.DateTimeFormat(locale, formatOptions).format(dateObj);
}

/**
 * Format a date to a relative time string (e.g., "2 hours ago")
 *
 * @param {Date|string|number} date - The date to format
 * @param {Object} [options] - Formatting options
 * @param {string} [options.locale='en-US'] - The locale to use for formatting
 * @returns {string} The relative time string
 */
export function formatRelativeTime(date, options = {}) {
  const { locale = 'en-US' } = options;

  // Convert to Date object if string or number
  const dateObj = date instanceof Date ? date : new Date(date);

  // Handle invalid dates
  if (isNaN(dateObj.getTime())) {
    console.error('Invalid date provided to formatRelativeTime:', date);
    return 'Invalid date';
  }

  const now = new Date();
  const diffMs = now - dateObj;
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);
  const diffMonth = Math.round(diffDay / 30);
  const diffYear = Math.round(diffMonth / 12);

  // Format based on the time difference
  if (diffSec < 60) {
    return 'just now';
  } else if (diffMin < 60) {
    return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffHour < 24) {
    return `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffDay < 30) {
    return `${diffDay} ${diffDay === 1 ? 'day' : 'days'} ago`;
  } else if (diffMonth < 12) {
    return `${diffMonth} ${diffMonth === 1 ? 'month' : 'months'} ago`;
  } else {
    return `${diffYear} ${diffYear === 1 ? 'year' : 'years'} ago`;
  }
}
