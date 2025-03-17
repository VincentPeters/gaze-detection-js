# Source Code Structure

This directory contains the source code for the Eye Contact Detection application.

## Directory Structure

- `main/`: Electron main process code
- `renderer/`: Electron renderer process code (React components)
- `shared/`: Code shared between main and renderer processes
- `services/`: Service modules for specific functionality
- `models/`: Machine learning model integration
- `utils/`: Utility functions and helpers
- `config/`: Configuration management
- `assets/`: Static assets (images, styles, model files)

## Architecture Overview

The application follows a multi-process architecture typical of Electron applications:

1. **Main Process**: A Node.js process that controls the application lifecycle, creates windows, and accesses native OS features.

2. **Renderer Processes**: Chromium processes that render the UI using React and communicate with the main process via IPC.

3. **Services**: Modular components that provide specific functionality like camera access, face detection, and media capture.

4. **Models**: Integration with machine learning models for face detection and eye contact detection.

The application uses a modular architecture to separate concerns and make the codebase maintainable and testable.
