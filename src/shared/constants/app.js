/**
 * Application Constants
 *
 * This file defines constants that are shared between the main and renderer processes.
 */

/**
 * Application name
 * @type {string}
 */
export const APP_NAME = 'Gaze Detection';

/**
 * Application version
 * @type {string}
 */
export const APP_VERSION = '1.0.0';

/**
 * Default window dimensions
 * @type {Object}
 */
export const DEFAULT_WINDOW_DIMENSIONS = {
  main: {
    width: 800,
    height: 600,
  },
  facePanel: {
    width: 300,
    height: 300,
  },
  settings: {
    width: 600,
    height: 500,
  },
};

/**
 * Default application settings
 * @type {Object}
 */
export const DEFAULT_SETTINGS = {
  camera: {
    deviceId: null, // Will be set to default camera
    width: 640,
    height: 480,
    frameRate: 30,
  },
  detection: {
    faceDetectionInterval: 100, // ms
    eyeContactThreshold: 0.7, // 0-1 confidence threshold
    minFaceSize: 100, // minimum face size in pixels
  },
  media: {
    captureDirectory: null, // Will be set to user's pictures directory
    screenshotFormat: 'png',
    videoFormat: 'mp4',
    videoQuality: 'high',
  },
  ui: {
    theme: 'light',
    showFaceBoxes: true,
    showEyeBoxes: true,
    showConfidenceScore: true,
  },
};

/**
 * Application states
 * @type {Object}
 */
export const APP_STATES = {
  INITIALIZING: 'initializing',
  READY: 'ready',
  DETECTING: 'detecting',
  RECORDING: 'recording',
  ERROR: 'error',
  SHUTDOWN: 'shutdown',
};

/**
 * Camera states
 * @type {Object}
 */
export const CAMERA_STATES = {
  UNAVAILABLE: 'unavailable',
  AVAILABLE: 'available',
  ACCESSING: 'accessing',
  ACTIVE: 'active',
  ERROR: 'error',
};

/**
 * Detection states
 * @type {Object}
 */
export const DETECTION_STATES = {
  INACTIVE: 'inactive',
  LOADING_MODELS: 'loadingModels',
  READY: 'ready',
  DETECTING: 'detecting',
  ERROR: 'error',
};
