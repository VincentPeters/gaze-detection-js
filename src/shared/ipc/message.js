/**
 * IPC Message Utilities
 *
 * This file provides utilities for creating and validating IPC messages
 * between the main and renderer processes.
 */

import { MessageTypes } from '../types/ipc.js';

/**
 * Generate a unique ID for IPC messages
 * @returns {string} A unique ID
 */
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a request message
 * @param {string} channel - The IPC channel
 * @param {any} payload - The message payload
 * @param {string} source - The source of the message
 * @param {string} destination - The destination of the message
 * @returns {Object} A formatted request message
 */
export function createRequestMessage(channel, payload, source, destination) {
  return {
    type: MessageTypes.REQUEST,
    id: generateId(),
    channel,
    payload,
    timestamp: Date.now(),
    source,
    destination
  };
}

/**
 * Create a response message
 * @param {string} requestId - The ID of the request being responded to
 * @param {string} channel - The IPC channel
 * @param {any} payload - The message payload
 * @param {string} source - The source of the message
 * @param {string} destination - The destination of the message
 * @returns {Object} A formatted response message
 */
export function createResponseMessage(requestId, channel, payload, source, destination) {
  return {
    type: MessageTypes.RESPONSE,
    id: requestId,
    channel,
    payload,
    timestamp: Date.now(),
    source,
    destination
  };
}

/**
 * Create a notification message
 * @param {string} channel - The IPC channel
 * @param {any} payload - The message payload
 * @param {string} source - The source of the message
 * @param {string} destination - The destination of the message
 * @returns {Object} A formatted notification message
 */
export function createNotificationMessage(channel, payload, source, destination) {
  return {
    type: MessageTypes.NOTIFICATION,
    id: generateId(),
    channel,
    payload,
    timestamp: Date.now(),
    source,
    destination
  };
}

/**
 * Create an error message
 * @param {string} requestId - The ID of the request that caused the error (optional)
 * @param {string} channel - The IPC channel
 * @param {string} code - The error code
 * @param {string} message - The error message
 * @param {any} details - Additional error details
 * @param {string} source - The source of the message
 * @param {string} destination - The destination of the message
 * @returns {Object} A formatted error message
 */
export function createErrorMessage(requestId, channel, code, message, details, source, destination) {
  return {
    type: MessageTypes.ERROR,
    id: requestId || generateId(),
    channel,
    payload: {
      code,
      message,
      details
    },
    timestamp: Date.now(),
    source,
    destination
  };
}

/**
 * Create a success response
 * @param {string} requestId - The ID of the request being responded to
 * @param {string} channel - The IPC channel
 * @param {any} data - The response data
 * @param {string} source - The source of the message
 * @param {string} destination - The destination of the message
 * @returns {Object} A formatted success response
 */
export function createSuccessResponse(requestId, channel, data, source, destination) {
  return createResponseMessage(
    requestId,
    channel,
    {
      success: true,
      data
    },
    source,
    destination
  );
}

/**
 * Create an error response
 * @param {string} requestId - The ID of the request being responded to
 * @param {string} channel - The IPC channel
 * @param {string} code - The error code
 * @param {string} message - The error message
 * @param {any} details - Additional error details
 * @param {string} source - The source of the message
 * @param {string} destination - The destination of the message
 * @returns {Object} A formatted error response
 */
export function createErrorResponse(requestId, channel, code, message, details, source, destination) {
  return createResponseMessage(
    requestId,
    channel,
    {
      success: false,
      error: {
        code,
        message,
        details
      }
    },
    source,
    destination
  );
}

/**
 * Validate a message structure
 * @param {Object} message - The message to validate
 * @returns {boolean} Whether the message is valid
 * @throws {Error} If the message is invalid
 */
export function validateMessage(message) {
  // Check required fields
  if (!message) {
    throw new Error('Message is required');
  }

  if (!message.type) {
    throw new Error('Message type is required');
  }

  if (!Object.values(MessageTypes).includes(message.type)) {
    throw new Error(`Invalid message type: ${message.type}`);
  }

  if (!message.id) {
    throw new Error('Message ID is required');
  }

  if (!message.channel) {
    throw new Error('Message channel is required');
  }

  if (message.payload === undefined) {
    throw new Error('Message payload is required');
  }

  // Additional validation based on message type
  switch (message.type) {
    case MessageTypes.REQUEST:
      // Requests must have a destination
      if (!message.destination) {
        throw new Error('Request message must have a destination');
      }
      break;

    case MessageTypes.RESPONSE:
      // Responses must have a matching request ID
      if (!message.id) {
        throw new Error('Response message must have an ID matching the request');
      }
      break;

    case MessageTypes.ERROR:
      // Error messages must have error details
      if (!message.payload.code || !message.payload.message) {
        throw new Error('Error message must have a code and message');
      }
      break;
  }

  return true;
}

/**
 * Check if a message is a success response
 * @param {Object} message - The message to check
 * @returns {boolean} Whether the message is a success response
 */
export function isSuccessResponse(message) {
  return (
    message.type === MessageTypes.RESPONSE &&
    message.payload &&
    message.payload.success === true
  );
}

/**
 * Check if a message is an error response
 * @param {Object} message - The message to check
 * @returns {boolean} Whether the message is an error response
 */
export function isErrorResponse(message) {
  return (
    (message.type === MessageTypes.RESPONSE &&
     message.payload &&
     message.payload.success === false) ||
    message.type === MessageTypes.ERROR
  );
}

/**
 * Extract error details from an error response
 * @param {Object} message - The error response message
 * @returns {Object} The error details
 */
export function getErrorFromResponse(message) {
  if (message.type === MessageTypes.ERROR) {
    return message.payload;
  }

  if (message.type === MessageTypes.RESPONSE &&
      message.payload &&
      message.payload.success === false) {
    return message.payload.error;
  }

  return null;
}

/**
 * Check if a message is a request message
 * @param {Object} message - The message to check
 * @returns {boolean} Whether the message is a request message
 */
export function isRequestMessage(message) {
  return message.type === MessageTypes.REQUEST;
}
