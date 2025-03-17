/**
 * IPC Channel Registry
 *
 * This file defines all IPC channels used in the application and their metadata.
 * It serves as a central registry to ensure consistency and prevent duplication.
 */

/**
 * Security levels for IPC channels
 * @enum {string}
 */
export const SecurityLevels = {
  PUBLIC: 'public',      // Available to all renderer processes
  PROTECTED: 'protected', // Available to specific renderer processes
  PRIVATE: 'private'     // Available only to the main process
};

/**
 * Channel registry entry structure
 * @typedef {Object} ChannelRegistryEntry
 * @property {string} name - The channel name
 * @property {string} description - Description of the channel's purpose
 * @property {Object} payloadSchema - Expected payload structure
 * @property {string} securityLevel - Security level from SecurityLevels
 * @property {Array<string>} allowedSenders - Who can send on this channel
 * @property {Array<string>} allowedReceivers - Who can receive on this channel
 */

/**
 * Registry of all IPC channels
 * @type {Object.<string, ChannelRegistryEntry>}
 */
export const ChannelRegistry = {
  // Basic communication channels
  'app:ready': {
    name: 'app:ready',
    description: 'Notifies renderer processes that the app is ready',
    payloadSchema: {},
    securityLevel: SecurityLevels.PUBLIC,
    allowedSenders: ['main'],
    allowedReceivers: ['all']
  },

  'app:error': {
    name: 'app:error',
    description: 'Notifies renderer processes of an application error',
    payloadSchema: {
      code: 'string',
      message: 'string',
      details: 'any'
    },
    securityLevel: SecurityLevels.PUBLIC,
    allowedSenders: ['main'],
    allowedReceivers: ['all']
  },

  // Window management channels
  'window:create': {
    name: 'window:create',
    description: 'Request to create a new window',
    payloadSchema: {
      type: 'string',
      options: 'object'
    },
    securityLevel: SecurityLevels.PROTECTED,
    allowedSenders: ['renderer-main'],
    allowedReceivers: ['main']
  },

  'window:close': {
    name: 'window:close',
    description: 'Request to close a window',
    payloadSchema: {
      windowId: 'string'
    },
    securityLevel: SecurityLevels.PROTECTED,
    allowedSenders: ['all'],
    allowedReceivers: ['main']
  },

  // Inter-window communication channels
  'window:message': {
    name: 'window:message',
    description: 'Send a message from one window to another',
    payloadSchema: {
      targetWindowId: 'number|string', // Target window ID or 'all' for broadcast
      data: 'any',                     // Message data
      messageType: 'string'            // Type of message for receiver to handle
    },
    securityLevel: SecurityLevels.PROTECTED,
    allowedSenders: ['all'],
    allowedReceivers: ['main', 'all']
  },

  'window:state-sync': {
    name: 'window:state-sync',
    description: 'Synchronize state between windows',
    payloadSchema: {
      domain: 'string',        // State domain (e.g., 'app', 'camera', 'detection')
      key: 'string',           // State key within domain
      value: 'any',            // State value
      source: 'string|number'  // Source window ID
    },
    securityLevel: SecurityLevels.PROTECTED,
    allowedSenders: ['all'],
    allowedReceivers: ['main', 'all']
  },

  'window:event': {
    name: 'window:event',
    description: 'Broadcast a window-related event',
    payloadSchema: {
      eventType: 'string',     // Type of event (e.g., 'focus', 'blur', 'resize')
      windowId: 'number',      // ID of the window that triggered the event
      data: 'any'              // Additional event data
    },
    securityLevel: SecurityLevels.PUBLIC,
    allowedSenders: ['main'],
    allowedReceivers: ['all']
  },

  'window:request-sync': {
    name: 'window:request-sync',
    description: 'Request synchronization of application state',
    payloadSchema: {
      domains: 'array',        // Array of state domains to sync
      requestId: 'string'      // Request identifier for response matching
    },
    securityLevel: SecurityLevels.PROTECTED,
    allowedSenders: ['all'],
    allowedReceivers: ['main']
  },

  // Camera channels
  'camera:list': {
    name: 'camera:list',
    description: 'Request a list of available cameras',
    payloadSchema: {},
    securityLevel: SecurityLevels.PUBLIC,
    allowedSenders: ['all'],
    allowedReceivers: ['main']
  },

  'camera:start': {
    name: 'camera:start',
    description: 'Request to start a camera',
    payloadSchema: {
      deviceId: 'string',
      resolution: 'object'
    },
    securityLevel: SecurityLevels.PROTECTED,
    allowedSenders: ['renderer-main'],
    allowedReceivers: ['main']
  },

  'camera:stop': {
    name: 'camera:stop',
    description: 'Request to stop a camera',
    payloadSchema: {
      streamId: 'string'
    },
    securityLevel: SecurityLevels.PROTECTED,
    allowedSenders: ['renderer-main'],
    allowedReceivers: ['main']
  },

  'camera:frame': {
    name: 'camera:frame',
    description: 'New camera frame available',
    payloadSchema: {
      streamId: 'string',
      data: 'any',
      timestamp: 'number'
    },
    securityLevel: SecurityLevels.PROTECTED,
    allowedSenders: ['main'],
    allowedReceivers: ['all']
  },

  // Detection channels
  'detection:start': {
    name: 'detection:start',
    description: 'Request to start detection',
    payloadSchema: {
      options: 'object'
    },
    securityLevel: SecurityLevels.PROTECTED,
    allowedSenders: ['renderer-main'],
    allowedReceivers: ['main']
  },

  'detection:stop': {
    name: 'detection:stop',
    description: 'Request to stop detection',
    payloadSchema: {},
    securityLevel: SecurityLevels.PROTECTED,
    allowedSenders: ['renderer-main'],
    allowedReceivers: ['main']
  },

  'detection:face:found': {
    name: 'detection:face:found',
    description: 'Face detected in frame',
    payloadSchema: {
      faceId: 'string',
      boundingBox: 'object',
      confidence: 'number',
      landmarks: 'object'
    },
    securityLevel: SecurityLevels.PUBLIC,
    allowedSenders: ['main'],
    allowedReceivers: ['all']
  },

  'detection:eye-contact:detected': {
    name: 'detection:eye-contact:detected',
    description: 'Eye contact detected',
    payloadSchema: {
      faceId: 'string',
      confidence: 'number',
      timestamp: 'number'
    },
    securityLevel: SecurityLevels.PUBLIC,
    allowedSenders: ['main'],
    allowedReceivers: ['all']
  },

  // Configuration channels
  'config:get': {
    name: 'config:get',
    description: 'Request application configuration',
    payloadSchema: {
      section: 'string'
    },
    securityLevel: SecurityLevels.PUBLIC,
    allowedSenders: ['all'],
    allowedReceivers: ['main']
  },

  'config:update': {
    name: 'config:update',
    description: 'Update application configuration',
    payloadSchema: {
      section: 'string',
      values: 'object'
    },
    securityLevel: SecurityLevels.PROTECTED,
    allowedSenders: ['renderer-main'],
    allowedReceivers: ['main']
  },

  // Media capture channels
  'media:capture-screenshot': {
    name: 'media:capture-screenshot',
    description: 'Capture a screenshot',
    payloadSchema: {
      faceId: 'string'
    },
    securityLevel: SecurityLevels.PROTECTED,
    allowedSenders: ['renderer-main', 'main'],
    allowedReceivers: ['main']
  },

  'media:start-recording': {
    name: 'media:start-recording',
    description: 'Start video recording',
    payloadSchema: {
      faceId: 'string',
      options: 'object'
    },
    securityLevel: SecurityLevels.PROTECTED,
    allowedSenders: ['renderer-main', 'main'],
    allowedReceivers: ['main']
  },

  'media:stop-recording': {
    name: 'media:stop-recording',
    description: 'Stop video recording',
    payloadSchema: {
      recordingId: 'string'
    },
    securityLevel: SecurityLevels.PROTECTED,
    allowedSenders: ['renderer-main', 'main'],
    allowedReceivers: ['main']
  },

  // Logging channels
  'log:message': {
    name: 'log:message',
    description: 'Log a message',
    payloadSchema: {
      level: 'string',
      message: 'string',
      data: 'any'
    },
    securityLevel: SecurityLevels.PUBLIC,
    allowedSenders: ['all'],
    allowedReceivers: ['main']
  }
};

/**
 * Get a channel from the registry
 * @param {string} channelName - The name of the channel to get
 * @returns {ChannelRegistryEntry|null} The channel entry or null if not found
 */
export function getChannel(channelName) {
  return ChannelRegistry[channelName] || null;
}

/**
 * Check if a channel exists in the registry
 * @param {string} channelName - The name of the channel to check
 * @returns {boolean} Whether the channel exists
 */
export function channelExists(channelName) {
  return ChannelRegistry.hasOwnProperty(channelName);
}

/**
 * Check if a sender is allowed to send on a channel
 * @param {string} channelName - The name of the channel
 * @param {string} sender - The sender ID
 * @returns {boolean} Whether the sender is allowed
 */
export function canSend(channelName, sender) {
  const channel = getChannel(channelName);
  if (!channel) {
    return false;
  }

  return channel.allowedSenders.includes(sender) || channel.allowedSenders.includes('all');
}

/**
 * Check if a receiver is allowed to receive on a channel
 * @param {string} channelName - The name of the channel
 * @param {string} receiver - The receiver ID
 * @returns {boolean} Whether the receiver is allowed
 */
export function canReceive(channelName, receiver) {
  const channel = getChannel(channelName);
  if (!channel) {
    return false;
  }

  return channel.allowedReceivers.includes(receiver) || channel.allowedReceivers.includes('all');
}

/**
 * Get all channels with a specific security level
 * @param {string} securityLevel - The security level to filter by
 * @returns {Array<ChannelRegistryEntry>} Array of matching channels
 */
export function getChannelsBySecurityLevel(securityLevel) {
  return Object.values(ChannelRegistry).filter(
    channel => channel.securityLevel === securityLevel
  );
}

/**
 * Get all channels that a specific sender can send on
 * @param {string} sender - The sender ID
 * @returns {Array<ChannelRegistryEntry>} Array of matching channels
 */
export function getChannelsForSender(sender) {
  return Object.values(ChannelRegistry).filter(
    channel => channel.allowedSenders.includes(sender) || channel.allowedSenders.includes('all')
  );
}

/**
 * Get all channels that a specific receiver can receive on
 * @param {string} receiver - The receiver ID
 * @returns {Array<ChannelRegistryEntry>} Array of matching channels
 */
export function getChannelsForReceiver(receiver) {
  return Object.values(ChannelRegistry).filter(
    channel => channel.allowedReceivers.includes(receiver) || channel.allowedReceivers.includes('all')
  );
}

/**
 * Get all channel names as an array
 * @returns {Array<string>} Array of channel names
 */
export function getAllChannelNames() {
  return Object.keys(ChannelRegistry);
}

/**
 * Get all public channel names
 * @returns {Array<string>} Array of public channel names
 */
export function getPublicChannelNames() {
  return getChannelsBySecurityLevel(SecurityLevels.PUBLIC).map(channel => channel.name);
}

/**
 * Get all protected channel names
 * @returns {Array<string>} Array of protected channel names
 */
export function getProtectedChannelNames() {
  return getChannelsBySecurityLevel(SecurityLevels.PROTECTED).map(channel => channel.name);
}

/**
 * Get all private channel names
 * @returns {Array<string>} Array of private channel names
 */
export function getPrivateChannelNames() {
  return getChannelsBySecurityLevel(SecurityLevels.PRIVATE).map(channel => channel.name);
}
