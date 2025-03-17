/**
 * Main Process State Store
 *
 * This file provides a centralized store for managing state in the main process.
 * It handles state updates, validation, persistence, and synchronization with renderer processes.
 */

import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import logger from '../../utils/logger/index.js';
import ipcManager from '../ipc/ipcManager.js';
import { createNotificationMessage } from '../../shared/ipc/message.js';

// Create a logger for the state store
const log = logger.createLogger('StateStore');

// State validators
const validators = {
  // Add validators for different domains and keys
};

// Listeners for state changes
const listeners = new Map();

// State that should be synchronized with renderers
const syncedState = new Set([
  'app.isReady',
  'app.theme',
  'camera.devices',
  'camera.selectedDevice',
  'camera.status',
  'detection.isActive',
  'detection.results',
  'detection.settings',
  'media.isRecording',
  'media.captureCount',
]);

/**
 * Check if a state key should be synchronized with renderers
 * @param {string} domain - The state domain
 * @param {string} key - The state key
 * @returns {boolean} - Whether the state should be synchronized
 */
function shouldSyncWithRenderer(domain, key) {
  return syncedState.has(`${domain}.${key}`);
}

/**
 * Notify listeners of state changes
 * @param {string} domain - The state domain
 * @param {string} key - The state key
 * @param {any} value - The new state value
 */
function notifyListeners(domain, key, value) {
  // Notify domain-level listeners
  if (listeners.has(domain)) {
    listeners.get(domain).forEach(listener => {
      try {
        listener(domain, key, value);
      } catch (error) {
        log.error(`Error in domain listener for ${domain}:`, error);
      }
    });
  }

  // Notify key-specific listeners
  const fullKey = `${domain}.${key}`;
  if (listeners.has(fullKey)) {
    listeners.get(fullKey).forEach(listener => {
      try {
        listener(value);
      } catch (error) {
        log.error(`Error in key listener for ${fullKey}:`, error);
      }
    });
  }
}

/**
 * Synchronize state with renderer processes
 * @param {string} domain - The state domain
 * @param {string} key - The state key
 * @param {any} value - The state value
 */
function syncWithRenderer(domain, key, value) {
  try {
    const payload = { domain, key, value };
    ipcManager.broadcastToRenderers('state:update', payload);
    log.debug(`Synchronized state ${domain}.${key} with renderers`);
  } catch (error) {
    log.error(`Error synchronizing state ${domain}.${key} with renderers:`, error);
  }
}

// The state store
const store = {
  // Initial state
  state: {
    app: {
      isReady: false,
      windows: new Map(),
      theme: 'light',
      errors: [],
    },
    camera: {
      devices: [],
      selectedDevice: null,
      status: 'idle',
      settings: {
        width: 640,
        height: 480,
        frameRate: 30,
      },
    },
    detection: {
      isActive: false,
      faceDetection: {
        isActive: false,
        settings: {
          minConfidence: 0.5,
          maxResults: 5,
        },
      },
      eyeContact: {
        isActive: false,
        settings: {
          threshold: 0.7,
          stabilizationFrames: 3,
        },
      },
      results: {
        faces: [],
        eyeContact: false,
        timestamp: null,
      },
    },
    media: {
      isRecording: false,
      captureCount: 0,
      storage: {
        path: app.getPath('pictures'),
        format: 'png',
      },
    },
  },

  /**
   * Get state from a specific domain and key
   * @param {string} domain - The state domain
   * @param {string} [key] - The state key (optional)
   * @returns {any} - The state value
   */
  getState: (domain, key) => {
    if (!store.state[domain]) {
      log.warn(`Attempted to access unknown state domain: ${domain}`);
      return null;
    }

    if (key !== undefined) {
      return store.state[domain][key];
    }

    return store.state[domain];
  },

  /**
   * Set state for a specific domain and key
   * @param {string} domain - The state domain
   * @param {string} [key] - The state key (optional)
   * @param {any} value - The new state value
   */
  setState: (domain, key, value) => {
    try {
      // Ensure domain exists
      if (!store.state[domain]) {
        log.warn(`Creating new state domain: ${domain}`);
        store.state[domain] = {};
      }

      // Validate changes if validators exist
      if (key && validators[domain] && validators[domain][key]) {
        const isValid = validators[domain][key](value);
        if (!isValid) {
          throw new Error(`Invalid value for ${domain}.${key}`);
        }
      }

      // Update state
      if (key !== undefined) {
        store.state[domain][key] = value;
        log.debug(`Updated state ${domain}.${key}`);
      } else {
        store.state[domain] = value;
        log.debug(`Updated state domain ${domain}`);
      }

      // Notify listeners
      notifyListeners(domain, key, value);

      // Sync with renderer if needed
      if (key && shouldSyncWithRenderer(domain, key)) {
        syncWithRenderer(domain, key, value);
      }
    } catch (error) {
      log.error(`Error setting state ${domain}.${key}:`, error);
      throw error;
    }
  },

  /**
   * Subscribe to state changes
   * @param {string} domain - The state domain
   * @param {string} [key] - The state key (optional)
   * @param {Function} listener - The listener function
   * @returns {Function} - A function to unsubscribe
   */
  subscribe: (domain, key, listener) => {
    // Handle case where key is the listener (domain-level subscription)
    if (typeof key === 'function') {
      listener = key;
      key = undefined;
    }

    const mapKey = key !== undefined ? `${domain}.${key}` : domain;

    if (!listeners.has(mapKey)) {
      listeners.set(mapKey, new Set());
    }

    listeners.get(mapKey).add(listener);
    log.debug(`Added listener for ${mapKey}`);

    // Return unsubscribe function
    return () => {
      if (listeners.has(mapKey)) {
        listeners.get(mapKey).delete(listener);
        if (listeners.get(mapKey).size === 0) {
          listeners.delete(mapKey);
        }
        log.debug(`Removed listener for ${mapKey}`);
      }
    };
  },

  /**
   * Reset state to initial values
   * @param {string} [domain] - The domain to reset (optional, resets all if not provided)
   */
  resetState: (domain) => {
    try {
      if (domain) {
        // Reset specific domain
        const initialState = {
          app: {
            isReady: false,
            windows: new Map(),
            theme: 'light',
            errors: [],
          },
          camera: {
            devices: [],
            selectedDevice: null,
            status: 'idle',
            settings: {
              width: 640,
              height: 480,
              frameRate: 30,
            },
          },
          detection: {
            isActive: false,
            faceDetection: {
              isActive: false,
              settings: {
                minConfidence: 0.5,
                maxResults: 5,
              },
            },
            eyeContact: {
              isActive: false,
              settings: {
                threshold: 0.7,
                stabilizationFrames: 3,
              },
            },
            results: {
              faces: [],
              eyeContact: false,
              timestamp: null,
            },
          },
          media: {
            isRecording: false,
            captureCount: 0,
            storage: {
              path: app.getPath('pictures'),
              format: 'png',
            },
          },
        };

        if (initialState[domain]) {
          store.setState(domain, null, initialState[domain]);
          log.info(`Reset state for domain: ${domain}`);
        } else {
          log.warn(`Attempted to reset unknown domain: ${domain}`);
        }
      } else {
        // Reset all domains
        Object.keys(store.state).forEach(domain => {
          store.resetState(domain);
        });
        log.info('Reset all state domains');
      }
    } catch (error) {
      log.error(`Error resetting state:`, error);
    }
  },

  /**
   * Save state to disk
   * @param {string} [domain] - The domain to save (optional, saves all if not provided)
   */
  saveState: (domain) => {
    try {
      const statePath = path.join(app.getPath('userData'), 'state');

      // Ensure state directory exists
      if (!fs.existsSync(statePath)) {
        fs.mkdirSync(statePath, { recursive: true });
      }

      if (domain) {
        // Save specific domain
        const stateToSave = store.getState(domain);
        if (stateToSave) {
          // Don't save non-serializable data
          const serializable = JSON.parse(JSON.stringify(stateToSave, (key, value) => {
            if (value instanceof Map) {
              return Array.from(value.entries());
            }
            return value;
          }));

          fs.writeFileSync(
            path.join(statePath, `${domain}.json`),
            JSON.stringify(serializable, null, 2)
          );
          log.info(`Saved state for domain: ${domain}`);
        }
      } else {
        // Save all domains
        Object.keys(store.state).forEach(domain => {
          store.saveState(domain);
        });
        log.info('Saved all state domains');
      }
    } catch (error) {
      log.error(`Error saving state:`, error);
    }
  },

  /**
   * Load state from disk
   * @param {string} [domain] - The domain to load (optional, loads all if not provided)
   */
  loadState: (domain) => {
    try {
      const statePath = path.join(app.getPath('userData'), 'state');

      if (!fs.existsSync(statePath)) {
        log.info('No saved state found');
        return;
      }

      if (domain) {
        // Load specific domain
        const filePath = path.join(statePath, `${domain}.json`);
        if (fs.existsSync(filePath)) {
          const data = fs.readFileSync(filePath, 'utf8');
          const loadedState = JSON.parse(data, (key, value) => {
            // Convert array entries back to Map if needed
            if (Array.isArray(value) && value.every(item => Array.isArray(item) && item.length === 2)) {
              return new Map(value);
            }
            return value;
          });

          store.setState(domain, null, loadedState);
          log.info(`Loaded state for domain: ${domain}`);
        }
      } else {
        // Load all domains
        fs.readdirSync(statePath).forEach(file => {
          if (file.endsWith('.json')) {
            const domain = file.replace('.json', '');
            store.loadState(domain);
          }
        });
        log.info('Loaded all available state domains');
      }
    } catch (error) {
      log.error(`Error loading state:`, error);
    }
  },

  /**
   * Initialize the state store
   */
  initialize: () => {
    log.info('Initializing state store');

    // Register IPC handlers for state operations
    ipcManager.registerHandler('state:get', async (message) => {
      try {
        const { domain, key } = message.payload;
        log.debug(`Received state:get request for ${domain}.${key}`);

        const value = store.getState(domain, key);
        return { success: true, data: value };
      } catch (error) {
        log.error('Error handling state:get request:', error);
        return {
          success: false,
          error: {
            message: 'Failed to get state',
            details: error.message
          }
        };
      }
    });

    ipcManager.registerHandler('state:set', async (message) => {
      try {
        const { domain, key, value } = message.payload;
        log.debug(`Received state:set request for ${domain}.${key}`);

        store.setState(domain, key, value);
        return { success: true };
      } catch (error) {
        log.error('Error handling state:set request:', error);
        return {
          success: false,
          error: {
            message: 'Failed to set state',
            details: error.message
          }
        };
      }
    });

    // Load saved state
    store.loadState();

    log.info('State store initialized');
  },

  /**
   * Shutdown the state store
   */
  shutdown: () => {
    log.info('Shutting down state store');

    // Save state before shutdown
    store.saveState();

    // Clear all listeners
    listeners.clear();

    log.info('State store shut down');
  }
};

export default store;
