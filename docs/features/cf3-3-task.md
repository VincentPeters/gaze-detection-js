## Task CF3-3: Implement Detection State Management [ ]

### Status
- [x] Not Started
- [ ] In Progress
- [ ] Complete
- [ ] Verified

### Objective
Create a system to manage and communicate eye contact detection state throughout the application, including threshold configuration and state transitions.

### Starting Point
- Working eye contact detection pipeline from CF3-2
- Face data state management from CF2-4

### Done When
- Eye contact state is tracked for each detected face
- State changes trigger appropriate UI updates
- Detection threshold is configurable via UI
- State is accessible to all application components
- State includes metadata (time looking, confidence)
- State transitions are debounced to prevent flicker
- History of recent state changes is maintained
- Status information is clearly communicated to users

### Implementation Guidelines
- Extend face data model with eye contact information:
  ```javascript
  // Update face data reducer to handle eye contact results
  function faceReducer(state, action) {
    switch (action.type) {
      case 'UPDATE_EYE_CONTACT': {
        const { faceId, isLooking, confidence } = action.payload;
        const face = state.faces[faceId];
        
        if (!face) return state;
        
        // Get current time
        const now = Date.now();
        
        // Determine if this is a state change
        const wasLooking = face.isLooking || false;
        const stateChanged = wasLooking !== isLooking;
        
        // Update the face data
        const updatedFace = {
          ...face,
          eyeContactScore: confidence,
          isLooking,
          // Update timestamp only on transition to looking
          lookingSince: isLooking && !wasLooking ? now : face.lookingSince,
          // Track last state change time
          lastStateChangeTime: stateChanged ? now : face.lastStateChangeTime,
        };
        
        return {
          ...state,
          faces: {
            ...state.faces,
            [faceId]: updatedFace
          },
          // Update metrics
          metrics: {
            ...state.metrics,
            stateChanges: stateChanged ? state.metrics.stateChanges + 1 : state.metrics.stateChanges,
            lastUpdateTime: now
          }
        };
      }
      // ... other reducer cases
    }
  }
  ```

- Create eye contact detection manager:
  ```javascript
  function useEyeContactDetection(options = {}) {
    const { threshold = 0.7, debounceTime = 300 } = options;
    const { faces, updateEyeContact } = useFaceState();
    const model = useEyeContactModel();
    const videoRef = useRef(null);
    
    // Debounce state changes to prevent flickering
    const debouncedStateUpdate = useCallback(
      debounce((faceId, isLooking, confidence) => {
        updateEyeContact(faceId, isLooking, confidence);
      }, debounceTime),
      [updateEyeContact, debounceTime]
    );
    
    // Detection function
    const detectEyeContact = useCallback(async () => {
      if (!videoRef.current || !model || !model.loaded) return;
      
      // Get faces in current state
      const activeFaces = Object.values(faces).filter(f => f.visible);
      
      // Process each visible face
      for (const face of activeFaces) {
        const result = await detectEyeContactForFace(
          videoRef.current,
          face,
          model.model,
          { threshold }
        );
        
        // Update state with debouncing to prevent flicker
        debouncedStateUpdate(face.id, result.isLooking, result.confidence);
      }
    }, [faces, model, threshold, debouncedStateUpdate]);
    
    // ... additional implementation
    
    return {
      detectEyeContact,
      isModelReady: model && model.loaded,
      // ... other returned values
    };
  }
  ```

- Implement threshold configuration:
  - Create UI controls for adjusting threshold
  - Store threshold in application configuration
  - Apply threshold in detection pipeline
  - Provide visual feedback on threshold changes

- Add detection metrics collection:
  - Track state change frequency
  - Record looking/not looking durations
  - Calculate confidence level statistics
  - Monitor detection performance

- Implement debouncing for stable output:
  - Require multiple consecutive detections for state change
  - Use time-based debouncing for transitions
  - Implement hysteresis for threshold crossing
  - Filter out momentary detection failures

- Common pitfalls to avoid:
  - Flickering detection state with noisy input
  - Poor threshold default causing false positives
  - Performance issues from excessive state updates
  - Complex state that's difficult to debug

### Dependencies
- Requires completion of CF3-2 (Detection Pipeline)
- Maximum time box: 6 hours