# Process Architecture: Main and Renderer Processes

## Overview

The Eye Contact Detection application follows Electron's multi-process architecture, which consists of a main process and multiple renderer processes. This document defines the responsibilities, boundaries, and communication patterns between these processes.

## Process Model

### Main Process

The main process is a Node.js process that serves as the entry point for the application. There is only one main process per application instance.

#### Responsibilities

- **Application Lifecycle Management**
  - Starting and stopping the application
  - Handling application events (ready, window-all-closed, activate, etc.)
  - Managing application state across the entire system
  - Coordinating graceful shutdown

- **Window Management**
  - Creating and destroying browser windows
  - Managing window state (minimize, maximize, focus, etc.)
  - Controlling window appearance and behavior
  - Handling window events (close, focus, blur, etc.)

- **System Integration**
  - Accessing native OS features and APIs
  - Managing system tray integration
  - Handling global shortcuts
  - Accessing file system and other Node.js APIs

- **Process Coordination**
  - Managing communication between renderer processes
  - Maintaining global application state
  - Coordinating activities that span multiple windows

- **Hardware Access**
  - Managing camera access and permissions
  - Handling hardware-related events
  - Coordinating resource usage across processes

- **Security Enforcement**
  - Validating and sanitizing data from renderer processes
  - Enforcing permissions and access controls
  - Preventing unauthorized access to system resources

### Renderer Processes

Renderer processes are Chromium processes that display the user interface. Each window has its own renderer process.

#### Responsibilities

- **User Interface Rendering**
  - Displaying React components and UI elements
  - Managing UI state and transitions
  - Handling animations and visual effects
  - Rendering detection results and overlays

- **User Interaction Handling**
  - Processing user input (clicks, keyboard, etc.)
  - Managing form state and validation
  - Handling drag-and-drop operations
  - Responding to user gestures

- **Local State Management**
  - Managing component-level state
  - Maintaining UI-specific state
  - Handling temporary data for the current window
  - Managing React context and component hierarchy

- **Data Presentation**
  - Formatting and displaying data
  - Rendering charts, graphs, and visualizations
  - Updating UI based on data changes
  - Providing feedback on processing status

- **Request Initiation**
  - Sending requests to the main process
  - Initiating actions that require system access
  - Requesting data from services
  - Triggering application-wide operations

## Process Boundaries

### Main Process Boundaries

The main process has access to:
- Full Node.js API
- Electron APIs
- Operating system resources
- File system
- Network resources
- Hardware devices

The main process should NOT:
- Directly manipulate the DOM
- Handle UI rendering logic
- Perform computationally intensive tasks that could block the event loop
- Store large amounts of data in memory

### Renderer Process Boundaries

Renderer processes have access to:
- DOM APIs
- Web APIs
- Limited Electron APIs (via contextBridge)
- React and other UI libraries

Renderer processes should NOT:
- Directly access Node.js APIs
- Directly access the file system
- Directly access hardware devices
- Perform operations that require elevated privileges

## Process Communication

### Communication Patterns

1. **Request-Response**
   - Renderer sends a request to the main process
   - Main process processes the request and sends a response
   - Used for operations that have a clear result

2. **Publish-Subscribe**
   - Main process publishes events to interested renderers
   - Renderer processes subscribe to events they care about
   - Used for broadcasting state changes or notifications

3. **One-Way Notification**
   - Either process sends a notification without expecting a response
   - Used for fire-and-forget operations or status updates

### Communication Channels

1. **IPC (Inter-Process Communication)**
   - Primary method for communication between processes
   - Implemented using Electron's ipcMain and ipcRenderer
   - Secured using contextBridge in the preload script

2. **Shared State via Main Process**
   - Main process acts as a state coordinator
   - Renderer processes request state updates
   - Main process broadcasts state changes

3. **Window Communication**
   - Main process facilitates communication between windows
   - Windows cannot directly communicate with each other

## Process Initialization

### Main Process Initialization

1. Application entry point (src/index.js) is executed
2. Application event listeners are registered
3. IPC handlers are registered
4. Initial window(s) are created
5. Services are initialized

### Renderer Process Initialization

1. Preload script (src/preload.js) is executed
2. Context bridge APIs are exposed
3. Window content is loaded
4. React application is initialized
5. Initial state is requested from main process
6. UI is rendered

## Error Handling

### Main Process Error Handling

- Uncaught exceptions are logged and may trigger application restart
- IPC errors are caught and reported back to the sender
- Critical errors may trigger graceful shutdown
- Service errors are isolated and reported

### Renderer Process Error Handling

- React error boundaries catch and display UI errors
- IPC communication errors are handled and displayed to the user
- Network errors are caught and retried or reported
- UI state is preserved when possible during errors

## Process Lifecycle

### Application Startup

1. Main process starts
2. Main process initializes core services
3. Main window is created
4. Main window loads and initializes React
5. Additional windows are created as needed

### Application Shutdown

1. User initiates shutdown or closes last window
2. Main process begins graceful shutdown
3. Services are stopped and resources released
4. Renderer processes are terminated
5. Main process exits

### Window Creation

1. Main process creates a new BrowserWindow
2. Preload script is injected
3. Window loads HTML content
4. Renderer process initializes
5. Window is displayed to user

### Window Destruction

1. User or system initiates window close
2. Renderer process saves state if needed
3. Window close event is processed
4. Renderer process is terminated
5. Main process updates window registry

## Security Considerations

### Process Isolation

- Renderer processes run in a sandboxed environment
- Node integration is disabled in renderer processes
- Context isolation is enabled
- Remote module is disabled

### Preload Script

- Exposes only necessary APIs to renderer processes
- Validates all IPC messages
- Uses contextBridge to create a secure API
- Follows principle of least privilege

### IPC Validation

- All IPC messages are validated in both directions
- Input from renderer processes is treated as untrusted
- Sensitive operations require explicit permission
- Error messages do not expose sensitive information

## Implementation Guidelines

### Main Process Implementation

- Organize code by feature or responsibility
- Keep the event loop responsive
- Delegate CPU-intensive tasks to worker threads
- Maintain clear boundaries between subsystems

### Renderer Process Implementation

- Use React for UI components
- Manage state using React hooks or context
- Communicate with main process only through IPC
- Handle errors gracefully with fallbacks

### Shared Code

- Use TypeScript interfaces for IPC message types
- Share constants for channel names and event types
- Avoid sharing business logic between processes
- Use serializable data structures for IPC

## Conclusion

This architecture establishes clear boundaries and responsibilities between the main and renderer processes, following Electron's security best practices and enabling efficient communication between processes. By adhering to these guidelines, the application will maintain a clear separation of concerns, be more secure, and be easier to maintain and extend.
