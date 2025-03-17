/**
 * Formatting Utilities
 *
 * This module provides utilities for formatting various types of data
 * for display in the UI.
 */

import { formatDate } from './dateFormatters.js';
import { formatNumber, formatCurrency } from './numberFormatters.js';
import { formatFileSize } from './fileFormatters.js';

// Re-export all formatters
export {
  formatDate,
  formatNumber,
  formatCurrency,
  formatFileSize
};

// Default export with all formatters
export default {
  formatDate,
  formatNumber,
  formatCurrency,
  formatFileSize
};
