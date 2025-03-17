# Main Process

This directory contains code for the Electron main process, which runs in a Node.js environment.

## Structure

- `windows/`: Window management code for creating and controlling application windows
- `ipc/`: IPC (Inter-Process Communication) handlers for communication with renderer processes
- `utils/`: Utility functions specific to the main process

The main process is responsible for:
- Creating and managing application windows
- Handling native OS integration
- Managing application lifecycle
- Coordinating communication between renderer processes
- Accessing Node.js APIs that aren't available in the renderer process
