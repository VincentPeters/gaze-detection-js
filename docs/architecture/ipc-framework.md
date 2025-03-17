# Inter-Process Communication (IPC) Framework

## Overview

This document describes the Inter-Process Communication (IPC) framework used in the Eye Contact Detection application. The framework provides a secure, structured, and efficient way for the main process and renderer processes to communicate with each other.

## Principles

1. **Security First**: All communication follows Electron's security best practices, including context isolation and proper validation.
2. **Structured Communication**: Messages follow a consistent format with clear typing and validation.
3. **Clear Boundaries**: Processes can only communicate on channels they are authorized to use.
4. **Error Handling**: All communication includes proper error handling and reporting.
5. **Performance**: Communication is optimized for performance, especially for high-frequency operations.

## Communication Patterns

The framework supports two primary communication patterns:

### 1. Request-Response Pattern

Used when a process needs to request information or an action from another process and expects a response.

```
Sender                                Receiver
  |                                      |
  |--- Request (channel, payload) ------>|
  |                                      | [Process request]
  |<---- Response (success/error) -------|
  |                                      |
```

### 2. Notification Pattern

Used when a process needs to notify another process of an event or state change, but doesn't expect a response.

```
Sender                                Receiver
  |                                      |
  |--- Notification (channel, payload) ->|
  |                                      | [Handle notification]
  |                                      |
```

## Message Structure

All IPC messages follow a consistent structure:

```javascript
{
  id: string,           // Unique message identifier
  type: string,         // Message type (request, response, notification, error)
  channel: string,      // The communication channel
  payload: any,         // The message payload
  timestamp: number,    // When the message was created
  sender: string,       // The sender's identifier
  receiver: string      // The intended receiver's identifier
}
```

### Message Types

- **Request**: A message requesting information or an action
- **Response**: A message responding to a request
- **Notification**: A one-way message notifying of an event or state change
- **Error**: A message indicating an error condition

## Channel Organization

Channels are organized by domain and follow a consistent naming pattern:

```
domain:action
```

Examples:
- `app:ready` - Notification that the application is ready
- `window:create` - Request to create a new window
- `camera:list` - Request to list available cameras
- `detection:start` - Request to start detection

### Security Levels

Channels are categorized by security level:

- **Public**: Can be accessed by any process
- **Protected**: Limited access based on sender/receiver
- **Private**: Highly restricted access

## Security Considerations

1. **Channel Whitelisting**: Only predefined channels are allowed
2. **Sender/Receiver Validation**: Messages are validated to ensure the sender is authorized
3. **Message Validation**: All messages are validated for structure and content
4. **Context Isolation**: The renderer process only has access to a limited API exposed through the preload script
5. **No Remote Module**: The remote module is disabled to prevent security vulnerabilities

## Error Handling

Errors are handled consistently throughout the framework:

1. **Validation Errors**: Errors in message format or content
2. **Authorization Errors**: Errors when a process tries to use a channel it's not authorized for
3. **Processing Errors**: Errors that occur while processing a message
4. **Timeout Errors**: Errors when a response is not received within the expected time

## Performance Optimization

1. **Message Batching**: Multiple messages can be batched for efficiency
2. **Selective Updates**: Only necessary data is sent to minimize overhead
3. **Throttling**: High-frequency messages are throttled to prevent overwhelming the receiver

## Implementation

### Shared Components

- **Message Utilities**: `src/shared/ipc/message.js` - Utilities for creating and validating messages
- **Channel Registry**: `src/shared/ipc/channels.js` - Registry of all channels with security information

### Main Process Components

- **IPC Manager**: `src/main/ipc/ipcManager.js` - Manages IPC communication in the main process
- **IPC Handlers**: `src/main/ipc/handlers.js` - Handlers for specific domains (app, window, camera, etc.)

### Renderer Process Components

- **IPC Client**: `src/renderer/ipc/ipcClient.js` - Client for IPC communication in the renderer process
- **Preload Script**: `src/preload.js` - Exposes a secure API to the renderer process

## Usage Examples

### Main Process

```javascript
// Register a handler for a request-response pattern
ipcManager.registerHandler('app:ready', async (message) => {
  return createSuccessResponse(message, {
    appName: app.getName(),
    appVersion: app.getVersion()
  });
});

// Send a notification to a renderer process
ipcManager.sendToRenderer(windowId, 'app:status', {
  status: 'running',
  uptime: process.uptime()
});
```

### Renderer Process

```javascript
// Send a request and get a response
const appInfo = await ipcClient.sendRequest('app:ready');
console.log(`App name: ${appInfo.appName}, version: ${appInfo.appVersion}`);

// Subscribe to notifications
const unsubscribe = ipcClient.subscribe('app:status', (payload) => {
  console.log(`App status: ${payload.status}, uptime: ${payload.uptime}`);
});

// Send a notification
ipcClient.sendNotification('log:message', {
  level: 'info',
  text: 'This is a log message'
});
```

## Conclusion

The IPC framework provides a secure, structured, and efficient way for processes to communicate in the Eye Contact Detection application. By following Electron's security best practices and implementing clear patterns for communication, the framework ensures that the application remains secure, maintainable, and performant.
