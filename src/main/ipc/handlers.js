/**
 * IPC Handlers for Main Process
 *
 * This file contains handlers for IPC messages from the renderer process.
 * Each handler is responsible for a specific domain of functionality.
 */

import { app, BrowserWindow } from 'electron';
import { createSuccessResponse, createErrorResponse } from '../../shared/ipc/message.js';
import logger from '../../utils/logger/index.js';
import { getChannel } from '../../shared/ipc/channels.js';

// Import window manager
import windowManager from '../windows/windowManager.js';

/**
 * Application handlers
 */
export const appHandlers = {
  /**
   * Handle app:ready message
   * @param {Object} message - The IPC message
   * @returns {Object} - The response message
   */
  'app:ready': async (message) => {
    try {
      logger.info('Received app:ready message from renderer');

      // Return app information
      return createSuccessResponse(message, {
        appName: app.getName(),
        appVersion: app.getVersion(),
        electronVersion: process.versions.electron,
        nodeVersion: process.versions.node,
        chromeVersion: process.versions.chrome,
        platform: process.platform,
        arch: process.arch
      });
    } catch (error) {
      logger.error('Error handling app:ready message', error);
      return createErrorResponse(message, {
        message: 'Failed to process app:ready message',
        details: error.message,
        severity: 'error'
      });
    }
  },

  /**
   * Handle app:quit message
   * @param {Object} message - The IPC message
   * @returns {Object} - The response message
   */
  'app:quit': async (message) => {
    try {
      logger.info('Received app:quit message from renderer');

      // Schedule app quit
      setTimeout(() => {
        app.quit();
      }, 100);

      return createSuccessResponse(message, {
        success: true
      });
    } catch (error) {
      logger.error('Error handling app:quit message', error);
      return createErrorResponse(message, {
        message: 'Failed to process app:quit message',
        details: error.message,
        severity: 'error'
      });
    }
  }
};

/**
 * Window handlers
 */
export const windowHandlers = {
  /**
   * Handle window:create message
   * @param {Object} message - The IPC message
   * @returns {Object} - The response message
   */
  'window:create': async (message) => {
    try {
      const { type, options } = message.payload;
      logger.info(`Received window:create message for window type: ${type}`);

      const window = await windowManager.createWindow(type, options);

      return createSuccessResponse(message, {
        windowId: window.id
      });
    } catch (error) {
      logger.error('Error handling window:create message', error);
      return createErrorResponse(message, {
        message: 'Failed to create window',
        details: error.message,
        severity: 'error'
      });
    }
  },

  /**
   * Handle window:close message
   * @param {Object} message - The IPC message
   * @returns {Object} - The response message
   */
  'window:close': async (message) => {
    try {
      const { windowId } = message.payload;
      logger.info(`Received window:close message for window ID: ${windowId}`);

      const success = windowManager.closeWindow(windowId);

      return createSuccessResponse(message, {
        success
      });
    } catch (error) {
      logger.error('Error handling window:close message', error);
      return createErrorResponse(message, {
        message: 'Failed to close window',
        details: error.message,
        severity: 'error'
      });
    }
  }
};

/**
 * Camera handlers
 */
export const cameraHandlers = {
  /**
   * Handle camera:list message
   * @param {Object} message - The IPC message
   * @returns {Object} - The response message
   */
  'camera:list': async (message) => {
    try {
      logger.info('Received camera:list message from renderer');

      // This is a placeholder - actual implementation would use a camera module
      // to get the list of available cameras
      const cameras = [
        { id: 'camera1', label: 'Default Camera', deviceId: 'default' }
      ];

      return createSuccessResponse(message, {
        cameras
      });
    } catch (error) {
      logger.error('Error handling camera:list message', error);
      return createErrorResponse(message, {
        message: 'Failed to list cameras',
        details: error.message,
        severity: 'error'
      });
    }
  }
};

/**
 * Configuration handlers
 */
export const configHandlers = {
  /**
   * Handle config:get message
   * @param {Object} message - The IPC message
   * @returns {Object} - The response message
   */
  'config:get': async (message) => {
    try {
      const { key } = message.payload;
      logger.info(`Received config:get message for key: ${key}`);

      // This is a placeholder - actual implementation would use a config module
      const config = {
        'app.theme': 'light',
        'camera.defaultId': 'default',
        'detection.sensitivity': 0.5
      };

      return createSuccessResponse(message, {
        value: config[key] || null
      });
    } catch (error) {
      logger.error('Error handling config:get message', error);
      return createErrorResponse(message, {
        message: 'Failed to get configuration',
        details: error.message,
        severity: 'error'
      });
    }
  },

  /**
   * Handle config:set message
   * @param {Object} message - The IPC message
   * @returns {Object} - The response message
   */
  'config:set': async (message) => {
    try {
      const { key, value } = message.payload;
      logger.info(`Received config:set message for key: ${key}`);

      // This is a placeholder - actual implementation would use a config module

      return createSuccessResponse(message, {
        success: true
      });
    } catch (error) {
      logger.error('Error handling config:set message', error);
      return createErrorResponse(message, {
        message: 'Failed to set configuration',
        details: error.message,
        severity: 'error'
      });
    }
  }
};

/**
 * Combine all handlers
 */
export const handlers = {
  ...appHandlers,
  ...windowHandlers,
  ...cameraHandlers,
  ...configHandlers
};

/**
 * Get a handler for a specific channel
 * @param {string} channel - The channel name
 * @returns {Function|null} - The handler function or null if not found
 */
export function getHandler(channel) {
  return handlers[channel] || null;
}

/**
 * Check if a handler exists for a channel
 * @param {string} channel - The channel name
 * @returns {boolean} - Whether a handler exists
 */
export function hasHandler(channel) {
  return channel in handlers;
}

export default handlers;
