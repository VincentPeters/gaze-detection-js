# State Management Architecture

## Overview

This document defines the state management architecture for the Eye Contact Detection application. It outlines how application state is organized, managed, and synchronized across different processes and components.

## Principles

1. **Single Source of Truth**: Each piece of state has a definitive source where it is managed.
2. **Unidirectional Data Flow**: State changes follow a predictable pattern from action to state update to UI update.
3. **Process-Appropriate Storage**: State is stored in the process where it is most relevant and accessed.
4. **Minimal Cross-Process Synchronization**: Only necessary state is synchronized between processes.
5. **Predictable Updates**: State changes are handled through well-defined actions and reducers.

## State Organization

The application state is organized into domains based on functionality:

### 1. Application State
- Application lifecycle
- Window management
- Global settings
- Error states

### 2. Camera State
- Available cameras
- Selected camera
- Camera status
- Stream settings

### 3. Detection State
- Face detection status
- Eye contact detection status
- Detection results
- Detection settings

### 4. Media Capture State
- Recording status
- Screenshot status
- Media storage information
- Capture settings

### 5. UI State
- Current view
- UI theme
- Layout preferences
- Notification states

## State Management Patterns

Different patterns are used depending on where the state is managed:

### Main Process State

State in the main process is managed using a simple store pattern:

```javascript
// Example of main process state store
const store = {
  state: {
    // Initial state
    app: {
      isReady: false,
      windows: new Map(),
    },
    // Other domains...
  },

  // Getters
  getState: (domain, key) => {
    if (key) return store.state[domain][key];
    return store.state[domain];
  },

  // Setters with validation
  setState: (domain, key, value) => {
    // Validate changes
    if (validators[domain] && validators[domain][key]) {
      const isValid = validators[domain][key](value);
      if (!isValid) throw new Error(`Invalid value for ${domain}.${key}`);
    }

    // Update state
    if (key) {
      store.state[domain][key] = value;
    } else {
      store.state[domain] = value;
    }

    // Notify listeners
    notifyListeners(domain, key, value);

    // Sync with renderer if needed
    if (shouldSyncWithRenderer(domain, key)) {
      syncWithRenderer(domain, key, value);
    }
  },

  // Subscribe to changes
  subscribe: (domain, key, listener) => {
    // Add listener and return unsubscribe function
  }
};
```

### Renderer Process State

State in the renderer process is managed using React Context and hooks:

```javascript
// Example of React Context for a domain
const CameraContext = React.createContext();

function CameraProvider({ children }) {
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [status, setStatus] = useState('idle');

  // Effects for initialization, cleanup, etc.

  // Methods for state updates
  const selectCamera = async (cameraId) => {
    setStatus('changing');
    try {
      // Request camera change via IPC
      await ipcClient.sendRequest('camera:select', { cameraId });
      setSelectedCamera(cameraId);
      setStatus('active');
    } catch (error) {
      setStatus('error');
      console.error('Failed to select camera:', error);
    }
  };

  // Value to provide
  const value = {
    cameras,
    selectedCamera,
    status,
    selectCamera,
  };

  return (
    <CameraContext.Provider value={value}>
      {children}
    </CameraContext.Provider>
  );
}

// Custom hook for using the context
function useCamera() {
  const context = useContext(CameraContext);
  if (!context) {
    throw new Error('useCamera must be used within a CameraProvider');
  }
  return context;
}
```

## Cross-Process State Synchronization

State is synchronized between processes using the IPC framework:

### Main to Renderer Synchronization

1. **Notification Pattern**: The main process sends notifications when state changes
2. **Request-Response Pattern**: Renderers can request current state from the main process

```javascript
// Example of main process sending state update
function syncWithRenderer(domain, key, value) {
  const payload = { domain, key, value };
  ipcManager.broadcastToRenderers('state:update', payload);
}

// Example of renderer subscribing to state updates
function useMainProcessState(domain, key) {
  const [value, setValue] = useState(null);

  useEffect(() => {
    // Initial fetch
    ipcClient.sendRequest('state:get', { domain, key })
      .then(result => setValue(result))
      .catch(error => console.error('Failed to get state:', error));

    // Subscribe to updates
    const unsubscribe = ipcClient.subscribe('state:update', (payload) => {
      if (payload.domain === domain && payload.key === key) {
        setValue(payload.value);
      }
    });

    return unsubscribe;
  }, [domain, key]);

  return value;
}
```

### Renderer to Main Synchronization

Renderers update main process state through explicit requests:

```javascript
// Example of renderer updating main process state
async function updateMainProcessState(domain, key, value) {
  try {
    await ipcClient.sendRequest('state:set', { domain, key, value });
    return true;
  } catch (error) {
    console.error('Failed to update state:', error);
    return false;
  }
}
```

## State Persistence

Some state needs to be persisted between application sessions:

```javascript
// Example of state persistence in main process
const persistentState = {
  save: (domain) => {
    const stateToSave = store.getState(domain);
    fs.writeFileSync(
      path.join(app.getPath('userData'), `${domain}-state.json`),
      JSON.stringify(stateToSave)
    );
  },

  load: (domain) => {
    try {
      const filePath = path.join(app.getPath('userData'), `${domain}-state.json`);
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        const loadedState = JSON.parse(data);
        store.setState(domain, null, loadedState);
      }
    } catch (error) {
      console.error(`Failed to load persistent state for ${domain}:`, error);
    }
  }
};
```

## Error Handling

State-related errors are handled consistently:

1. **Validation Errors**: Prevented through schema validation before state updates
2. **Synchronization Errors**: Detected and logged, with retry mechanisms
3. **Inconsistent State**: Resolved through reconciliation processes
4. **Recovery Strategies**: Including state reset, partial updates, and fallbacks

## Performance Considerations

1. **Selective Updates**: Only changed parts of state trigger updates
2. **Batched Updates**: Multiple state changes are batched when possible
3. **Memoization**: Computed values are cached to prevent unnecessary recalculations
4. **Lazy Loading**: State is loaded only when needed
5. **Throttling**: High-frequency updates are throttled to prevent performance issues

## Implementation Guidelines

### Main Process State Implementation

1. Create domain-specific state modules
2. Implement validation for state updates
3. Set up IPC handlers for state requests
4. Establish persistence for relevant state

### Renderer Process State Implementation

1. Create React contexts for each domain
2. Implement custom hooks for accessing state
3. Set up IPC communication for main process state
4. Use local state for UI-specific concerns

## Usage Examples

### Main Process Example

```javascript
// Initialize application state
appState.initialize();

// Update state when a camera is connected
function handleCameraConnected(camera) {
  const cameras = [...appState.getState('camera', 'devices'), camera];
  appState.setState('camera', 'devices', cameras);

  // This will automatically notify renderers via IPC
}

// React to state changes
appState.subscribe('detection', 'isActive', (isActive) => {
  if (isActive) {
    startDetectionProcess();
  } else {
    stopDetectionProcess();
  }
});
```

### Renderer Process Example

```javascript
function CameraSelector() {
  const { cameras, selectedCamera, selectCamera } = useCamera();

  return (
    <div>
      <h2>Select Camera</h2>
      <select
        value={selectedCamera || ''}
        onChange={(e) => selectCamera(e.target.value)}
      >
        <option value="">Select a camera</option>
        {cameras.map(camera => (
          <option key={camera.id} value={camera.id}>
            {camera.label}
          </option>
        ))}
      </select>
    </div>
  );
}
```

## Conclusion

This state management architecture provides a clear and consistent approach to managing application state across processes and components. By following these patterns and guidelines, the Eye Contact Detection application will maintain a predictable state flow, efficient updates, and proper synchronization between processes.
