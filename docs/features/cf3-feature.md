# Feature CF3: Critical Business Logic [ ]

## Progress
- [ ] Requirements Defined
- [ ] Tasks Created
- [ ] Implementation Started
- [ ] Testing Complete
- [ ] Feature Complete

## 1. Purpose & Value
- **Goal:** Implement the core eye contact detection functionality using the converted machine learning model
- **Value:** Delivers the primary value proposition of detecting when users make eye contact with the camera
- **Success Criteria:** System can reliably detect eye contact in real-time with accuracy comparable to the original Python version

## 2. Functional Requirements
- **Must Have:**
  - Converted eye contact detection model in TensorFlow.js format
  - Integration of model with face detection results
  - Real-time eye contact analysis
  - Binary yes/no detection output
  - Visual indication of eye contact status

- **Won't Have:**
  - Advanced confidence metrics
  - Detection analytics or history
  - Multiple detection models or comparison
  - Complex configuration of model parameters
  - Gaze direction estimation (just binary eye contact)

## 3. Implementation Tasks

### Task CF3-1: Convert Eye Contact Model to TensorFlow.js
**Objective:** Transform the existing PyTorch eye contact detection model to TensorFlow.js format

**Starting Point:**
- Original PyTorch model from Python application

**Done When:**
- Model is successfully converted to TensorFlow.js format
- Converted model loads in the JavaScript application
- Input/output shapes match expectations
- Model produces meaningful predictions

**Simplest Approach:**
- Use ONNX as an intermediate conversion format
- Focus on functional conversion rather than optimization
- Include minimal pre/post-processing code
- Verify with test images from original application

### Task CF3-2: Implement Eye Contact Detection Pipeline
**Objective:** Create the processing pipeline from face detection to eye contact detection

**Starting Point:**
- Converted model and face detection functionality

**Done When:**
- Face detection results are properly prepared for the eye contact model
- Model receives appropriate input format
- Detection results are processed and interpreted
- Pipeline runs efficiently without blocking the UI

**Simplest Approach:**
- Extract face image based on bounding box
- Apply same preprocessing as original Python version
- Run inference in a non-blocking way (Web Worker if needed)
- Focus on the "happy path" with basic error handling

### Task CF3-3: Implement Detection State Management
**Objective:** Create a system to manage and communicate eye contact detection state

**Starting Point:**
- Working eye contact detection pipeline

**Done When:**
- Eye contact state is tracked for each detected face
- State changes trigger appropriate UI updates
- Detection threshold is configurable
- State is accessible to other application components

**Simplest Approach:**
- Add eye contact properties to face data model
- Use simple boolean state for detected/not detected
- Implement basic debouncing to prevent flicker
- Keep configuration minimal (just threshold value)

### Task CF3-4: Create Detection Visualization
**Objective:** Display eye contact detection status clearly in the UI

**Starting Point:**
- Eye contact detection with state management

**Done When:**
- UI clearly indicates when eye contact is detected
- Status changes are immediately visible
- Visualization doesn't interfere with application performance
- Indicators are intuitive for users

**Simplest Approach:**
- Use color changes for detection status
- Implement simple visual indicators (not complex animations)
- Focus on clarity rather than aesthetics
- Ensure indicators are visible in various lighting conditions

## 4. Basic Testing Approach
- **Manual Test:** User looks at camera, then away, verifying detection status changes appropriately
- **Edge Cases:** 
  - Test with glasses, different lighting conditions
  - Verify behavior with multiple faces in frame
  - Check for false positives/negatives in challenging conditions

## 5. Dependencies
- **Required Before:** 
  - CF2 (Data Essentials - face detection)
  
- **Enables:** 
  - LL2 (Deployment Minimum - screenshot capture)