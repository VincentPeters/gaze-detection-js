# Module and Component Organization

## Overview

This document defines the patterns for organizing modules and components within the Eye Contact Detection application. It establishes a consistent structure that promotes code reuse, maintainability, and clear dependencies.

## Principles

1. **Feature-Based Organization**: Group related components and modules by feature or domain
2. **Clear Boundaries**: Maintain clear boundaries between different parts of the application
3. **Explicit Dependencies**: Make dependencies between modules explicit and manageable
4. **Reusability**: Design components and modules for reuse where appropriate
5. **Consistency**: Follow consistent naming and organization patterns throughout the codebase

## Directory Structure

The application follows a feature-based organization within the established directory structure:

```
src/
├── main/                  # Main process code
│   ├── windows/           # Window management
│   ├── ipc/               # IPC handling for main process
│   ├── state/             # Main process state management
│   ├── services/          # Main process services
│   │   ├── camera/        # Camera service
│   │   ├── detection/     # Detection service
│   │   └── media/         # Media capture service
│   └── utils/             # Main process utilities
├── renderer/              # Renderer process code
│   ├── components/        # React components
│   │   ├── common/        # Shared/common components
│   │   ├── app/           # App-level components
│   │   ├── camera/        # Camera-related components
│   │   ├── detection/     # Detection-related components
│   │   ├── media/         # Media capture components
│   │   └── settings/      # Settings components
│   ├── hooks/             # Custom React hooks
│   ├── state/             # Renderer state management
│   ├── ipc/               # IPC client for renderer
│   ├── utils/             # Renderer utilities
│   └── assets/            # Static assets
│       ├── styles/        # CSS styles
│       └── images/        # Images
├── shared/                # Code shared between processes
│   ├── constants/         # Shared constants
│   ├── types/             # Type definitions
│   ├── ipc/               # IPC message definitions
│   └── utils/             # Shared utilities
└── utils/                 # Application-wide utilities
    ├── logger/            # Logging utilities
    └── config/            # Configuration utilities
```

## Component Organization

### Component Hierarchy

Components are organized in a hierarchy based on their scope and purpose:

1. **Page Components**: Top-level components that represent entire pages or views
2. **Feature Components**: Components that implement specific features
3. **Common Components**: Reusable components used across multiple features
4. **UI Components**: Basic UI elements with minimal business logic

### Component File Structure

Each component follows a consistent file structure:

```
ComponentName/
├── index.jsx             # Main component file with default export
├── ComponentName.jsx     # Component implementation (for larger components)
├── ComponentName.css     # Component-specific styles (if needed)
├── subcomponents/        # Subcomponents used only by this component
│   ├── SubComponent.jsx  # Subcomponent implementation
│   └── ...
└── hooks/                # Component-specific hooks
    ├── useSpecificHook.js # Custom hook for this component
    └── ...
```

For simpler components, a single file approach is used:

```jsx
// SimpleComponent.jsx
import React from 'react';
import './SimpleComponent.css';

function SimpleComponent(props) {
  // Implementation
}

export default SimpleComponent;
```

## Module Organization

### Module Types

The application defines several types of modules:

1. **Service Modules**: Provide functionality to other parts of the application
2. **Utility Modules**: Provide helper functions and utilities
3. **State Modules**: Manage application state
4. **IPC Modules**: Handle inter-process communication
5. **Configuration Modules**: Manage application configuration

### Module File Structure

Each module follows a consistent file structure:

```
module-name/
├── index.js              # Public API with default export
├── module-name.js        # Main implementation
├── sub-modules/          # Sub-modules (if needed)
│   ├── sub-module.js     # Sub-module implementation
│   └── ...
└── utils/                # Module-specific utilities
    ├── utility.js        # Utility implementation
    └── ...
```

For simpler modules, a single file approach is used:

```javascript
// simpleModule.js
/**
 * Simple module description
 */

// Implementation

export default {
  // Public API
};
```

## Naming Conventions

### Files and Directories

- **Component Files**: PascalCase (e.g., `CameraSelector.jsx`)
- **Component Directories**: PascalCase (e.g., `CameraSelector/`)
- **Module Files**: kebab-case (e.g., `camera-service.js`)
- **Module Directories**: kebab-case (e.g., `camera-service/`)
- **Utility Files**: camelCase (e.g., `formatTimestamp.js`)
- **Hook Files**: camelCase, prefixed with "use" (e.g., `useCamera.js`)
- **Test Files**: Same as the file they test, with `.test` or `.spec` suffix

### Component Names

- **Component Names**: PascalCase (e.g., `CameraSelector`)
- **Subcomponent Names**: PascalCase, can be prefixed with parent component name for clarity (e.g., `CameraSelectorOption`)

### Function and Variable Names

- **React Hooks**: camelCase, prefixed with "use" (e.g., `useCamera`)
- **Event Handlers**: camelCase, prefixed with "handle" (e.g., `handleCameraSelect`)
- **Callback Props**: camelCase, prefixed with "on" (e.g., `onCameraSelect`)
- **Boolean Props/Variables**: camelCase, prefixed with "is", "has", "should", etc. (e.g., `isLoading`, `hasError`)

## Import/Export Patterns

### Default Exports

- Each component should have a default export
- Main module functionality should be exported as default
- Index files should re-export the main functionality as default

```javascript
// Component example
export default function MyComponent() { /* ... */ }

// Module example
const myModule = { /* ... */ };
export default myModule;

// Index file example
export { default } from './MyComponent';
```

### Named Exports

- Utility functions should use named exports
- Multiple related items should use named exports
- Types and interfaces should use named exports

```javascript
// Utility functions
export function formatDate() { /* ... */ }
export function parseDate() { /* ... */ }

// Related items
export const Colors = { /* ... */ };
export const Sizes = { /* ... */ };

// Types
export const MessageTypes = { /* ... */ };
```

### Import Order

Imports should be organized in the following order:

1. External dependencies (React, Electron, etc.)
2. Internal modules from other directories
3. Internal modules from the same directory
4. Assets (styles, images, etc.)

```javascript
// External dependencies
import React, { useState, useEffect } from 'react';
import { ipcRenderer } from 'electron';

// Internal modules from other directories
import { useAppState } from '../../state/useAppState';
import logger from '../../../utils/logger';

// Internal modules from the same directory
import { formatCameraName } from './utils';
import CameraOption from './CameraOption';

// Assets
import './CameraSelector.css';
```

## Component Composition Patterns

### Composition over Props

Prefer component composition over complex props:

```jsx
// Good
<Card>
  <CardHeader>Title</CardHeader>
  <CardBody>Content</CardBody>
  <CardFooter>Footer</CardFooter>
</Card>

// Avoid
<Card
  title="Title"
  content="Content"
  footer="Footer"
/>
```

### Render Props

Use render props for components that need to share logic:

```jsx
<DataFetcher url="/api/data">
  {(data, loading, error) => (
    loading ? <Loading /> : error ? <Error error={error} /> : <DataDisplay data={data} />
  )}
</DataFetcher>
```

### Higher-Order Components

Use higher-order components for cross-cutting concerns:

```jsx
// HOC example
const withErrorBoundary = (Component) => {
  return class ErrorBoundary extends React.Component {
    // Error boundary implementation
    render() {
      return <Component {...this.props} />;
    }
  };
};

// Usage
const SafeComponent = withErrorBoundary(MyComponent);
```

## State Management Integration

### Component State

- Use local state for UI-specific state that doesn't need to be shared
- Use `useState` for simple state
- Use `useReducer` for complex state logic

### Application State

- Use the state management architecture defined in the state management document
- Access application state through the provided hooks
- Update application state through the provided methods

```jsx
// Example of using application state
function CameraSelector() {
  const { devices, selectedDevice, selectCamera } = useCameraStateContext();

  return (
    <div>
      <select value={selectedDevice} onChange={(e) => selectCamera(e.target.value)}>
        {devices.map(device => (
          <option key={device.id} value={device.id}>{device.label}</option>
        ))}
      </select>
    </div>
  );
}
```

## Cross-Process Module Usage

### Shared Modules

Modules in the `shared` directory can be used by both main and renderer processes:

```javascript
// In main process
import { MessageTypes } from '../shared/types/ipc';

// In renderer process
import { MessageTypes } from '../shared/types/ipc';
```

### Process-Specific Modules

Modules in `main` and `renderer` directories should only be used by their respective processes:

```javascript
// In main process
import windowManager from './windows/windowManager';

// In renderer process
import { useCamera } from './hooks/useCamera';
```

## Error Handling Patterns

### Component Error Boundaries

Use error boundaries to catch and handle errors in component trees:

```jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return <ErrorDisplay error={this.state.error} />;
    }
    return this.props.children;
  }
}

// Usage
<ErrorBoundary>
  <MyComponent />
</ErrorBoundary>
```

### Try-Catch in Async Functions

Use try-catch blocks in async functions:

```javascript
async function fetchData() {
  try {
    const response = await fetch('/api/data');
    return await response.json();
  } catch (error) {
    logger.error('Failed to fetch data:', error);
    throw new Error('Failed to fetch data');
  }
}
```

## Testing Integration

### Component Testing

Components should be designed with testing in mind:

- Avoid direct DOM manipulation
- Use data attributes for test selectors
- Keep components focused on a single responsibility

```jsx
// Testable component example
function Button({ onClick, children, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      data-testid="button"
    >
      {children}
    </button>
  );
}
```

### Module Testing

Modules should have clear interfaces that can be mocked for testing:

```javascript
// Testable module example
export function calculateTotal(items) {
  return items.reduce((total, item) => total + item.price, 0);
}

export function formatCurrency(amount) {
  return `$${amount.toFixed(2)}`;
}
```

## Documentation

### Component Documentation

Each component should include:

- A brief description of its purpose
- Props documentation
- Usage examples

```jsx
/**
 * CameraSelector - A component for selecting a camera from available devices
 *
 * @param {Object} props
 * @param {Array} props.devices - List of available camera devices
 * @param {string} props.selectedDevice - ID of the currently selected device
 * @param {Function} props.onSelect - Callback when a device is selected
 */
function CameraSelector({ devices, selectedDevice, onSelect }) {
  // Implementation
}
```

### Module Documentation

Each module should include:

- A brief description of its purpose
- Function documentation
- Usage examples

```javascript
/**
 * Camera utilities for managing camera devices
 */

/**
 * Get available camera devices
 * @returns {Promise<Array>} List of camera devices
 */
export async function getAvailableDevices() {
  // Implementation
}
```

## Conclusion

This module and component organization approach provides a consistent structure for the Eye Contact Detection application. By following these patterns, the codebase will be more maintainable, reusable, and easier to understand for developers working on the project.
