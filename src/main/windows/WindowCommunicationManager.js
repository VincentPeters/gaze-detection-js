/**
 * Window Communication Manager
 *
 * Handles communication between different application windows.
 * This manager provides a reliable way for windows to exchange messages
 * and synchronize state across the application.
 */

import { BrowserWindow } from 'electron';
import logger from '../../utils/logger/index.js';
import ipcManager from '../ipc/ipcManager.js';
import { createNotificationMessage } from '../../shared/ipc/message.js';
import stateStore from '../state/store.js';
import windowManager from './windowManager.js';

// Create a logger for the window communication manager
const log = logger.createLogger('WindowCommunication');

/**
 * WindowCommunicationManager class
 */
class WindowCommunicationManager {
  constructor() {
    this.initialized = false;
    this.channelHandlers = new Map();
    this.windowRegistry = new Map();
  }

  /**
   * Initialize the window communication manager
   */
  initialize() {
    if (this.initialized) return;

    log.info('Initializing window communication manager');

    // Register handlers for inter-window communication channels
    this.registerChannelHandlers();

    // Register window lifecycle event listeners
    this.registerWindowLifecycleListeners();

    this.initialized = true;
    log.info('Window communication manager initialized');
  }

  /**
   * Register handlers for inter-window communication channels
   */
  registerChannelHandlers() {
    // Handle direct window-to-window messages
    ipcManager.registerHandler('window:message', async (message) => {
      try {
        const { targetWindowId, data, messageType } = message.payload;
        const sourceWindowId = this.extractWindowIdFromSender(message.sender);

        log.debug(`Handling window:message from ${sourceWindowId} to ${targetWindowId}`);

        if (targetWindowId === 'all') {
          // Broadcast to all windows except sender
          this.broadcastMessageToAllExcept(sourceWindowId, messageType, data);
          return { success: true };
        } else {
          // Send to specific window
          const success = this.sendMessageToWindow(targetWindowId, messageType, data, sourceWindowId);
          return { success };
        }
      } catch (error) {
        log.error('Error handling window:message:', error);
        return {
          success: false,
          error: {
            message: 'Failed to route window message',
            details: error.message
          }
        };
      }
    });

    // Handle state synchronization between windows
    ipcManager.registerHandler('window:state-sync', async (message) => {
      try {
        const { domain, key, value, source } = message.payload;
        const sourceWindowId = source || this.extractWindowIdFromSender(message.sender);

        log.debug(`Handling window:state-sync from ${sourceWindowId} for ${domain}.${key}`);

        // Update the central state store
        stateStore.setState(domain, key, value);

        // Broadcast state change to all windows except source
        this.broadcastStateChange(domain, key, value, sourceWindowId);

        return { success: true };
      } catch (error) {
        log.error('Error handling window:state-sync:', error);
        return {
          success: false,
          error: {
            message: 'Failed to synchronize state',
            details: error.message
          }
        };
      }
    });

    // Handle window state sync requests
    ipcManager.registerHandler('window:request-sync', async (message) => {
      try {
        const { domains, requestId } = message.payload;
        const sourceWindowId = this.extractWindowIdFromSender(message.sender);

        log.debug(`Handling window:request-sync from ${sourceWindowId} for domains: ${domains.join(', ')}`);

        // Get state for requested domains
        const stateData = {};
        domains.forEach(domain => {
          stateData[domain] = stateStore.getState(domain);
        });

        // Send state back to requester
        this.sendMessageToWindow(sourceWindowId, 'sync-response', {
          requestId,
          stateData
        });

        return { success: true };
      } catch (error) {
        log.error('Error handling window:request-sync:', error);
        return {
          success: false,
          error: {
            message: 'Failed to process sync request',
            details: error.message
          }
        };
      }
    });
  }

  /**
   * Register window lifecycle event listeners
   */
  registerWindowLifecycleListeners() {
    // Listen for window creation events
    ipcManager.registerListener('window:created', (message) => {
      const { id, type } = message.payload;
      this.registerWindow(id, type);
    });

    // Listen for window closed events
    ipcManager.registerListener('window:closed', (message) => {
      const { id } = message.payload;
      this.unregisterWindow(id);
    });
  }

  /**
   * Extract window ID from sender string (e.g., 'renderer-123' -> 123)
   * @param {string} sender - The sender identifier
   * @returns {number|null} The window ID or null if not found
   */
  extractWindowIdFromSender(sender) {
    if (sender === 'main') return 'main';

    const match = sender.match(/renderer-(\d+)/);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }

    return null;
  }

  /**
   * Register a window with the communication manager
   * @param {number} windowId - The window ID
   * @param {string} windowType - The window type
   */
  registerWindow(windowId, windowType) {
    this.windowRegistry.set(windowId, {
      type: windowType,
      registeredAt: Date.now()
    });

    log.info(`Registered window ${windowId} (${windowType}) with communication manager`);
  }

  /**
   * Unregister a window from the communication manager
   * @param {number} windowId - The window ID
   */
  unregisterWindow(windowId) {
    if (this.windowRegistry.has(windowId)) {
      this.windowRegistry.delete(windowId);
      log.info(`Unregistered window ${windowId} from communication manager`);
    }
  }

  /**
   * Send a message to a specific window
   * @param {number|string} windowId - The target window ID
   * @param {string} messageType - The message type
   * @param {any} data - The message data
   * @param {number|string} sourceId - The source window ID
   * @returns {boolean} Whether the message was sent successfully
   */
  sendMessageToWindow(windowId, messageType, data, sourceId = 'main') {
    try {
      // Get the window instance
      const window = typeof windowId === 'number'
        ? BrowserWindow.fromId(windowId)
        : windowManager.getWindowById(windowId);

      if (!window || window.isDestroyed()) {
        log.warn(`Cannot send message to window ${windowId}: window not found or destroyed`);
        return false;
      }

      // Create the message
      const message = createNotificationMessage(
        'window:message',
        {
          messageType,
          data,
          sourceId
        },
        sourceId === 'main' ? 'main' : `renderer-${sourceId}`,
        `renderer-${windowId}`
      );

      // Send the message
      window.webContents.send('window:message', message);
      log.debug(`Sent message of type '${messageType}' to window ${windowId}`);
      return true;
    } catch (error) {
      log.error(`Error sending message to window ${windowId}:`, error);
      return false;
    }
  }

  /**
   * Broadcast a message to all windows except the sender
   * @param {number|string} sourceId - The source window ID to exclude
   * @param {string} messageType - The message type
   * @param {any} data - The message data
   * @returns {number} The number of windows the message was sent to
   */
  broadcastMessageToAllExcept(sourceId, messageType, data) {
    try {
      let sendCount = 0;

      // Get all windows
      const windows = windowManager.getAllWindows();

      // Send to each window except source
      windows.forEach(window => {
        if (window && !window.isDestroyed() && window.id !== sourceId) {
          // Create the message
          const message = createNotificationMessage(
            'window:message',
            {
              messageType,
              data,
              sourceId
            },
            sourceId === 'main' ? 'main' : `renderer-${sourceId}`,
            `renderer-${window.id}`
          );

          // Send the message
          window.webContents.send('window:message', message);
          sendCount++;
        }
      });

      log.debug(`Broadcast message of type '${messageType}' to ${sendCount} windows`);
      return sendCount;
    } catch (error) {
      log.error(`Error broadcasting message:`, error);
      return 0;
    }
  }

  /**
   * Broadcast a state change to all windows except the source
   * @param {string} domain - The state domain
   * @param {string} key - The state key
   * @param {any} value - The state value
   * @param {number|string} sourceId - The source window ID to exclude
   * @returns {number} The number of windows the state change was sent to
   */
  broadcastStateChange(domain, key, value, sourceId) {
    try {
      let sendCount = 0;

      // Get all windows
      const windows = windowManager.getAllWindows();

      // Create the state sync message
      const messageData = {
        domain,
        key,
        value,
        source: sourceId
      };

      // Send to each window except source
      windows.forEach(window => {
        if (window && !window.isDestroyed() && window.id !== sourceId) {
          // Create the message
          const message = createNotificationMessage(
            'window:state-sync',
            messageData,
            'main',
            `renderer-${window.id}`
          );

          // Send the message
          window.webContents.send('window:state-sync', message);
          sendCount++;
        }
      });

      log.debug(`Broadcast state change ${domain}.${key} to ${sendCount} windows`);
      return sendCount;
    } catch (error) {
      log.error(`Error broadcasting state change:`, error);
      return 0;
    }
  }

  /**
   * Broadcast a window event to all windows
   * @param {string} eventType - The event type
   * @param {number} windowId - The window ID that triggered the event
   * @param {any} data - Additional event data
   * @returns {number} The number of windows the event was sent to
   */
  broadcastWindowEvent(eventType, windowId, data = {}) {
    try {
      let sendCount = 0;

      // Get all windows
      const windows = windowManager.getAllWindows();

      // Create the window event message
      const messageData = {
        eventType,
        windowId,
        data
      };

      // Send to each window
      windows.forEach(window => {
        if (window && !window.isDestroyed()) {
          // Create the message
          const message = createNotificationMessage(
            'window:event',
            messageData,
            'main',
            `renderer-${window.id}`
          );

          // Send the message
          window.webContents.send('window:event', message);
          sendCount++;
        }
      });

      log.debug(`Broadcast window event ${eventType} to ${sendCount} windows`);
      return sendCount;
    } catch (error) {
      log.error(`Error broadcasting window event:`, error);
      return 0;
    }
  }

  /**
   * Shut down the window communication manager
   */
  shutdown() {
    log.info('Shutting down window communication manager');

    // Clear registries
    this.windowRegistry.clear();
    this.channelHandlers.clear();

    this.initialized = false;
    log.info('Window communication manager shut down');
  }
}

export default new WindowCommunicationManager();
