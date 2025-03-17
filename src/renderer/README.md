# Renderer Process

This directory contains code for the Electron renderer processes, which run in a Chromium environment.

## Structure

- `components/`: Reusable React components
- `contexts/`: React context providers for state management
- `hooks/`: Custom React hooks
- `pages/`: Page components that represent different screens in the application
- `layouts/`: Layout components that define the structure of pages

The renderer process is responsible for:
- Rendering the user interface using React
- Handling user interactions
- Communicating with the main process via IPC
- Processing and displaying data from the main process
