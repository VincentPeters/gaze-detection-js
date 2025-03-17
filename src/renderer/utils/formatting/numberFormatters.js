/**
 * Number Formatting Utilities
 *
 * This module provides utilities for formatting numbers.
 */

/**
 * Format a number with thousands separators and decimal places
 *
 * @param {number} value - The number to format
 * @param {Object} [options] - Formatting options
 * @param {number} [options.decimals=0] - Number of decimal places
 * @param {string} [options.locale='en-US'] - The locale to use for formatting
 * @returns {string} The formatted number string
 */
export function formatNumber(value, options = {}) {
  const {
    decimals = 0,
    locale = 'en-US'
  } = options;

  // Handle non-numeric values
  if (typeof value !== 'number' || isNaN(value)) {
    console.error('Invalid number provided to formatNumber:', value);
    return 'Invalid number';
  }

  // Format the number
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

/**
 * Format a number as currency
 *
 * @param {number} value - The number to format
 * @param {Object} [options] - Formatting options
 * @param {string} [options.currency='USD'] - The currency code
 * @param {string} [options.locale='en-US'] - The locale to use for formatting
 * @returns {string} The formatted currency string
 */
export function formatCurrency(value, options = {}) {
  const {
    currency = 'USD',
    locale = 'en-US'
  } = options;

  // Handle non-numeric values
  if (typeof value !== 'number' || isNaN(value)) {
    console.error('Invalid number provided to formatCurrency:', value);
    return 'Invalid amount';
  }

  // Format the currency
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency
  }).format(value);
}

/**
 * Format a number as a percentage
 *
 * @param {number} value - The number to format (0-1)
 * @param {Object} [options] - Formatting options
 * @param {number} [options.decimals=0] - Number of decimal places
 * @param {string} [options.locale='en-US'] - The locale to use for formatting
 * @returns {string} The formatted percentage string
 */
export function formatPercentage(value, options = {}) {
  const {
    decimals = 0,
    locale = 'en-US'
  } = options;

  // Handle non-numeric values
  if (typeof value !== 'number' || isNaN(value)) {
    console.error('Invalid number provided to formatPercentage:', value);
    return 'Invalid percentage';
  }

  // Format the percentage
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}
