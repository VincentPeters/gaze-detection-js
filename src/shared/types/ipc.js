/**
 * IPC Types
 *
 * This file defines types and interfaces for IPC communication between
 * the main and renderer processes. These are shared to ensure consistency.
 *
 * Note: In a TypeScript project, these would be actual TypeScript interfaces.
 * Since we're using JavaScript, they serve as documentation.
 */

/**
 * IPC Channels
 *
 * Enum-like object defining all valid IPC channels for communication
 * between main and renderer processes.
 *
 * @typedef {Object} IpcChannels
 */
export const IpcChannels = {
  // Basic communication
  TO_MAIN: 'toMain',
  FROM_MAIN: 'fromMain',

  // Window management
  CREATE_WINDOW: 'createWindow',
  CLOSE_WINDOW: 'closeWindow',
  MINIMIZE_WINDOW: 'minimizeWindow',
  MAXIMIZE_WINDOW: 'maximizeWindow',

  // Application state
  GET_APP_STATE: 'getAppState',
  UPDATE_APP_STATE: 'updateAppState',

  // Camera and detection
  START_CAMERA: 'startCamera',
  STOP_CAMERA: 'stopCamera',
  CAMERA_FRAME: 'cameraFrame',
  DETECTION_RESULT: 'detectionResult',

  // Media capture
  CAPTURE_SCREENSHOT: 'captureScreenshot',
  START_RECORDING: 'startRecording',
  STOP_RECORDING: 'stopRecording',

  // Configuration
  GET_CONFIG: 'getConfig',
  UPDATE_CONFIG: 'updateConfig',

  // Logging and errors
  LOG_MESSAGE: 'logMessage',
  ERROR_OCCURRED: 'errorOccurred',
};

/**
 * Message Types
 *
 * Enum-like object defining the types of messages that can be sent
 * between processes.
 *
 * @typedef {Object} MessageTypes
 */
export const MessageTypes = {
  REQUEST: 'request',
  RESPONSE: 'response',
  NOTIFICATION: 'notification',
  ERROR: 'error',
};

/**
 * IPC Message
 *
 * Base structure for all IPC messages.
 *
 * @typedef {Object} IpcMessage
 * @property {string} type - The message type (from MessageTypes)
 * @property {string} id - Unique identifier for request-response correlation
 * @property {*} payload - The message payload
 */

/**
 * Error Severity
 *
 * Enum-like object defining error severity levels.
 *
 * @typedef {Object} ErrorSeverity
 */
export const ErrorSeverity = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
};

/**
 * Window Types
 *
 * Enum-like object defining the types of windows in the application.
 *
 * @typedef {Object} WindowTypes
 */
export const WindowTypes = {
  MAIN: 'main',
  FACE_PANEL: 'facePanel',
  SETTINGS: 'settings',
  ABOUT: 'about',
};
