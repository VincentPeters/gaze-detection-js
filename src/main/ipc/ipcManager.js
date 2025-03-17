/**
 * IPC Manager for Main Process
 *
 * This file provides a centralized manager for handling IPC communication
 * in the main process. It registers handlers, validates messages, and
 * provides utilities for sending messages to renderer processes.
 */

import { ipcMain, BrowserWindow } from 'electron';
import logger from '../../utils/logger/index.js';
import {
  validateMessage,
  createSuccessResponse,
  createErrorResponse,
  createNotificationMessage,
  isRequestMessage
} from '../../shared/ipc/message.js';
import {
  channelExists,
  canSend,
  canReceive,
  getChannel
} from '../../shared/ipc/channels.js';
import handlers from './handlers.js';

// Create a logger instance for the IPC manager
const log = logger.createLogger('IpcManager');

// Store registered handlers
const registeredHandlers = new Map();

/**
 * Register a handler for a request-response pattern
 * @param {string} channel - The channel to register for
 * @param {Function} handler - The handler function
 */
export function registerHandler(channel, handler) {
  // Validate channel
  if (!channelExists(channel)) {
    log.error(`Attempted to register handler for unknown channel: ${channel}`);
    return;
  }

  // Check if main process can receive on this channel
  if (!canReceive(channel, 'main')) {
    log.error(`Main process is not allowed to receive on channel: ${channel}`);
    return;
  }

  // Create the handler wrapper
  const handlerWrapper = async (event, message) => {
    try {
      // Validate the message
      if (!validateMessage(message)) {
        log.error(`Invalid message received on channel ${channel}:`, message);
        return createErrorResponse(message, {
          message: 'Invalid message format',
          details: 'The message does not conform to the expected format',
          severity: 'error'
        });
      }

      // Check if this is a request message
      if (!isRequestMessage(message)) {
        log.error(`Non-request message received on request channel ${channel}`);
        return createErrorResponse(message, {
          message: 'Invalid message type',
          details: 'Expected a request message',
          severity: 'error'
        });
      }

      // Check if the sender is allowed to send on this channel
      if (!canSend(channel, message.sender)) {
        log.error(`Sender ${message.sender} is not allowed to send on channel ${channel}`);
        return createErrorResponse(message, {
          message: 'Unauthorized sender',
          details: `${message.sender} is not authorized to send on ${channel}`,
          severity: 'error'
        });
      }

      // Call the handler
      return await handler(message);
    } catch (error) {
      log.error(`Error in handler for channel ${channel}:`, error);
      return createErrorResponse(message, {
        message: 'Handler error',
        details: error.message,
        severity: 'error'
      });
    }
  };

  // Register the handler
  ipcMain.handle(channel, handlerWrapper);

  // Store the handler for later removal
  registeredHandlers.set(channel, handlerWrapper);

  log.info(`Registered handler for channel: ${channel}`);
}

/**
 * Register a listener for a one-way notification pattern
 * @param {string} channel - The channel to register for
 * @param {Function} listener - The listener function
 */
export function registerListener(channel, listener) {
  // Validate channel
  if (!channelExists(channel)) {
    log.error(`Attempted to register listener for unknown channel: ${channel}`);
    return;
  }

  // Check if main process can receive on this channel
  if (!canReceive(channel, 'main')) {
    log.error(`Main process is not allowed to receive on channel: ${channel}`);
    return;
  }

  // Create the listener wrapper
  const listenerWrapper = (event, message) => {
    try {
      // Validate the message
      if (!validateMessage(message)) {
        log.error(`Invalid message received on channel ${channel}:`, message);
        return;
      }

      // Check if the sender is allowed to send on this channel
      if (!canSend(channel, message.sender)) {
        log.error(`Sender ${message.sender} is not allowed to send on channel ${channel}`);
        return;
      }

      // Call the listener
      listener(message);
    } catch (error) {
      log.error(`Error in listener for channel ${channel}:`, error);
    }
  };

  // Register the listener
  ipcMain.on(channel, listenerWrapper);

  // Store the listener for later removal
  registeredHandlers.set(channel, listenerWrapper);

  log.info(`Registered listener for channel: ${channel}`);
}

/**
 * Send a message to a specific renderer process
 * @param {number} windowId - The ID of the window to send to
 * @param {string} channel - The channel to send on
 * @param {any} payload - The payload to send
 */
export function sendToRenderer(windowId, channel, payload) {
  try {
    // Validate channel
    if (!channelExists(channel)) {
      log.error(`Attempted to send on unknown channel: ${channel}`);
      return;
    }

    // Check if main process can send on this channel
    if (!canSend(channel, 'main')) {
      log.error(`Main process is not allowed to send on channel: ${channel}`);
      return;
    }

    // Find the window
    const window = BrowserWindow.fromId(windowId);
    if (!window) {
      log.error(`Window with ID ${windowId} not found`);
      return;
    }

    // Create a notification message
    const message = createNotificationMessage(
      channel,
      payload,
      'main',
      'renderer'
    );

    // Send the message
    window.webContents.send(channel, message);
  } catch (error) {
    log.error(`Error sending message to renderer on channel ${channel}:`, error);
  }
}

/**
 * Broadcast a message to all renderer processes
 * @param {string} channel - The channel to send on
 * @param {any} payload - The payload to send
 */
export function broadcastToRenderers(channel, payload) {
  try {
    // Validate channel
    if (!channelExists(channel)) {
      log.error(`Attempted to broadcast on unknown channel: ${channel}`);
      return;
    }

    // Check if main process can send on this channel
    if (!canSend(channel, 'main')) {
      log.error(`Main process is not allowed to send on channel: ${channel}`);
      return;
    }

    // Create a notification message
    const message = createNotificationMessage(
      channel,
      payload,
      'main',
      'renderer'
    );

    // Send to all windows
    BrowserWindow.getAllWindows().forEach(window => {
      window.webContents.send(channel, message);
    });
  } catch (error) {
    log.error(`Error broadcasting message on channel ${channel}:`, error);
  }
}

/**
 * Forward a message from one renderer to another
 * @param {number} fromWindowId - The ID of the source window
 * @param {number} toWindowId - The ID of the destination window
 * @param {string} channel - The channel to send on
 * @param {any} payload - The payload to send
 */
export function forwardBetweenRenderers(fromWindowId, toWindowId, channel, payload) {
  try {
    // Validate channel
    if (!channelExists(channel)) {
      log.error(`Attempted to forward on unknown channel: ${channel}`);
      return;
    }

    // Find the destination window
    const toWindow = BrowserWindow.fromId(toWindowId);
    if (!toWindow) {
      log.error(`Destination window with ID ${toWindowId} not found`);
      return;
    }

    // Create a notification message
    const message = createNotificationMessage(
      channel,
      payload,
      `renderer-${fromWindowId}`,
      `renderer-${toWindowId}`
    );

    // Send the message
    toWindow.webContents.send(channel, message);
  } catch (error) {
    log.error(`Error forwarding message on channel ${channel}:`, error);
  }
}

/**
 * Unregister a handler or listener
 * @param {string} channel - The channel to unregister
 */
export function unregisterHandler(channel) {
  try {
    // Check if the handler is registered
    if (!registeredHandlers.has(channel)) {
      log.warn(`No handler registered for channel: ${channel}`);
      return;
    }

    // Remove the handler
    ipcMain.removeHandler(channel);
    ipcMain.removeListener(channel, registeredHandlers.get(channel));

    // Remove from the map
    registeredHandlers.delete(channel);

    log.info(`Unregistered handler for channel: ${channel}`);
  } catch (error) {
    log.error(`Error unregistering handler for channel ${channel}:`, error);
  }
}

/**
 * Unregister all handlers and listeners
 */
export function unregisterAllHandlers() {
  try {
    // Unregister each handler
    for (const [channel, handler] of registeredHandlers.entries()) {
      ipcMain.removeHandler(channel);
      ipcMain.removeListener(channel, handler);
      log.info(`Unregistered handler for channel: ${channel}`);
    }

    // Clear the map
    registeredHandlers.clear();

    log.info('Unregistered all handlers');
  } catch (error) {
    log.error('Error unregistering all handlers:', error);
  }
}

/**
 * Initialize the IPC manager
 */
export function initialize() {
  log.info('Initializing IPC manager');

  // Register handlers from the handlers module
  Object.entries(handlers).forEach(([channel, handler]) => {
    registerHandler(channel, handler);
  });

  // Register specific listeners
  registerListener('log:message', (message) => {
    const { level, text, meta } = message.payload;
    logger[level](text, meta);
  });

  // Add a direct listener for the toMain channel
  ipcMain.on('toMain', (event, message) => {
    log.info('Received direct toMain message:', message);

    // Send a response back on the fromMain channel
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window && !window.isDestroyed()) {
      window.webContents.send('fromMain', `Response from main process: ${message}`);
    }
  });

  log.info('IPC manager initialized');
}

/**
 * Shutdown the IPC manager
 */
export function shutdown() {
  log.info('Shutting down IPC manager');

  // Unregister all handlers
  unregisterAllHandlers();

  log.info('IPC manager shut down');
}

// Export the IPC manager
export default {
  initialize,
  shutdown,
  registerHandler,
  registerListener,
  unregisterHandler,
  unregisterAllHandlers,
  sendToRenderer,
  broadcastToRenderers,
  forwardBetweenRenderers
};
