## Task CF2-4: Define Face Data Model and State Management [ ]

### Status
- [x] Not Started
- [ ] In Progress
- [ ] Complete
- [ ] Verified

### Objective
Create a structured data model for storing face detection and tracking information and implement state management to make this data accessible throughout the application.

### Starting Point
- Application with face detection and tracking
- Basic application state management from MS2

### Done When
- Face data model is clearly defined
- Detection and tracking results are stored in application state
- State updates trigger appropriate UI refreshes
- Face data is accessible to all components that need it
- State management is performant with frequent updates
- Face data includes all properties needed for eye contact detection
- State transitions are smooth and predictable
- Developer API for accessing face data is clear and consistent

### Implementation Guidelines
- Define the face data model:
  ```typescript
  interface FaceData {
    // Core identification
    id: number;             // Unique tracking ID
    trackId: string;        // String ID for external reference
    
    // Detection data
    boundingBox: {          // Face rectangle
      x: number;
      y: number;
      width: number;
      height: number;
    };
    landmarks?: any;        // Facial landmarks if detected
    confidence: number;     // Detection confidence (0-1)
    
    // Tracking metadata
    firstSeen: number;      // Timestamp when first detected
    lastSeen: number;       // Timestamp when last detected
    missingFrames: number;  // Frames since last detection
    visible: boolean;       // Currently visible in frame
    
    // Eye contact data (added later)
    eyeContactScore?: number; // Eye contact probability (0-1)
    isLooking?: boolean;      // Whether eye contact is detected
    lookingSince?: number;    // When eye contact began
    
    // Capture data
    lastCaptureTime?: number; // When last screenshot was taken
  }
  
  interface FaceState {
    faces: Record<string, FaceData>;  // All tracked faces by ID
    currentFaceId?: string;           // Current primary face (for single face optimization)
    detectionActive: boolean;         // Whether detection is running
    stats: {
      fps: number;                    // Detection framerate
      lastUpdateTime: number;         // Last state update time
      faceCount: number;              // Number of faces currently tracked
    };
  }
  ```

- Implement state management for face data:
  ```javascript
  // Using React Context for state management
  
  const initialFaceState = {
    faces: {},
    currentFaceId: null,
    detectionActive: false,
    stats: {
      fps: 0,
      lastUpdateTime: 0,
      faceCount: 0
    }
  };
  
  const FaceContext = React.createContext();
  
  function FaceProvider({ children }) {
    const [state, dispatch] = useReducer(faceReducer, initialFaceState);
    
    // Provide actions for updating face state
    const updateFaces = (detectionResults, trackingResults) => {
      dispatch({ 
        type: 'UPDATE_FACES', 
        payload: { detections: detectionResults, tracking: trackingResults } 
      });
    };
    
    const setDetectionActive = (active) => {
      dispatch({ type: 'SET_DETECTION_ACTIVE', payload: active });
    };
    
    // Calculate additional statistics
    const stats = useMemo(() => {
      // Calculate FPS, face count, etc.
      return {
        ...state.stats,
        // Additional calculated stats
      };
    }, [state.stats]);
    
    return (
      <FaceContext.Provider value={{ 
        ...state, 
        stats,
        updateFaces, 
        setDetectionActive 
      }}>
        {children}
      </FaceContext.Provider>
    );
  }
  ```

- Create a reducer for face state updates:
  - Handle face detection updates
  - Manage tracking information
  - Update face statistics
  - Handle state transitions

- Implement hooks for consuming face data:
  - `useFaces()` for accessing all face data
  - `useCurrentFace()` for primary face (optimization)
  - `useFaceStats()` for detection statistics
  - `useFaceById(id)` for specific face data

- Optimize for performance:
  - Use memoization for derived data
  - Implement selective re-rendering
  - Batch updates when possible
  - Consider performance impact of frequent updates

- Common pitfalls to avoid:
  - Overly complex state nesting
  - Redundant or duplicate face data
  - Performance issues with large face counts
  - Excessive re-rendering on state updates

### Dependencies
- Requires completion of CF2-3 (Face Tracking)
- Maximum time box: 5 hours