/**
 * File Formatting Utilities
 *
 * This module provides utilities for formatting file-related information.
 */

/**
 * Format a file size in bytes to a human-readable string
 *
 * @param {number} bytes - The file size in bytes
 * @param {Object} [options] - Formatting options
 * @param {number} [options.decimals=2] - Number of decimal places
 * @param {boolean} [options.binary=false] - Use binary (1024) instead of decimal (1000) units
 * @returns {string} The formatted file size string
 */
export function formatFileSize(bytes, options = {}) {
  const {
    decimals = 2,
    binary = false
  } = options;

  // Handle non-numeric values
  if (typeof bytes !== 'number' || isNaN(bytes) || bytes < 0) {
    console.error('Invalid bytes value provided to formatFileSize:', bytes);
    return 'Invalid size';
  }

  // Use binary (1024) or decimal (1000) units
  const unit = binary ? 1024 : 1000;

  // Define units
  const units = binary
    ? ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
    : ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  // Handle zero bytes
  if (bytes === 0) return '0 B';

  // Calculate the appropriate unit
  const i = Math.floor(Math.log(bytes) / Math.log(unit));

  // Format the size
  return `${parseFloat((bytes / Math.pow(unit, i)).toFixed(decimals))} ${units[i]}`;
}

/**
 * Format a file extension to a readable type
 *
 * @param {string} filename - The filename or extension
 * @returns {string} The formatted file type
 */
export function formatFileType(filename) {
  if (!filename || typeof filename !== 'string') {
    console.error('Invalid filename provided to formatFileType:', filename);
    return 'Unknown';
  }

  // Extract extension
  const extension = filename.includes('.')
    ? filename.split('.').pop().toLowerCase()
    : filename.toLowerCase();

  // Map of common extensions to readable types
  const typeMap = {
    // Images
    'jpg': 'JPEG Image',
    'jpeg': 'JPEG Image',
    'png': 'PNG Image',
    'gif': 'GIF Image',
    'svg': 'SVG Image',
    'webp': 'WebP Image',

    // Documents
    'pdf': 'PDF Document',
    'doc': 'Word Document',
    'docx': 'Word Document',
    'xls': 'Excel Spreadsheet',
    'xlsx': 'Excel Spreadsheet',
    'ppt': 'PowerPoint Presentation',
    'pptx': 'PowerPoint Presentation',
    'txt': 'Text File',
    'rtf': 'Rich Text Document',

    // Audio
    'mp3': 'MP3 Audio',
    'wav': 'WAV Audio',
    'ogg': 'OGG Audio',
    'flac': 'FLAC Audio',

    // Video
    'mp4': 'MP4 Video',
    'avi': 'AVI Video',
    'mov': 'QuickTime Video',
    'wmv': 'Windows Media Video',
    'webm': 'WebM Video',

    // Code
    'js': 'JavaScript File',
    'jsx': 'React JSX File',
    'ts': 'TypeScript File',
    'tsx': 'React TSX File',
    'html': 'HTML File',
    'css': 'CSS File',
    'json': 'JSON File',
    'xml': 'XML File',
    'md': 'Markdown File',

    // Archives
    'zip': 'ZIP Archive',
    'rar': 'RAR Archive',
    'tar': 'TAR Archive',
    'gz': 'GZip Archive',
    '7z': '7-Zip Archive'
  };

  // Return the mapped type or a generic type
  return typeMap[extension] || `${extension.toUpperCase()} File`;
}
