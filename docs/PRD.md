# JavaScript Refactoring Plan: Eye Contact Detection Application

I'll help you create a comprehensive plan to refactor this Python-based eye contact detection application into JavaScript. Let me start by understanding the current system, analyzing JavaScript alternatives, and then creating a detailed PRD for the refactoring process.

## Current System Analysis

The existing application is a Python-based interactive art installation that detects when viewers make eye contact with a camera. Key components include:

1. **Face detection** using MediaPipe
2. **Eye contact detection** using a custom PyTorch model
3. **UI management** with both OpenCV windows and Tkinter
4. **Configuration management** with dynamic parameter adjustment
5. **Media capture** (screenshots and videos) when eye contact is detected
6. **Logging system** for application events

## JavaScript Refactoring Options

### Web-Based vs. Desktop Approach

**Option 1: Web Application (Browser-Based)**
- **Pros**:
  - Cross-platform compatibility
  - Modern development ecosystem
  - Easy deployment
  - Native access to webcams via MediaDevices API
- **Cons**:
  - Limited system access for file operations
  - May require additional permissions
  - Custom model integration might be more complex

**Option 2: Desktop Application (Electron)**
- **Pros**:
  - Full system access (file system, multiple windows)
  - Can integrate with Node.js for backend operations
  - Combines web technologies with desktop capabilities
- **Cons**:
  - Larger application size
  - More complex development setup
  - Higher resource usage

### Face Detection & Eye Contact Model Options

**Face Detection Libraries:**
1. **face-api.js**: JavaScript face detection library built on TensorFlow.js
   - Provides face detection, landmark detection, and expression recognition
   - Well-documented and actively maintained
   - Works in browser and Node.js environments

2. **MediaPipe for Web**:
   - Official web implementation of MediaPipe
   - Similar API to the Python version being used currently
   - Supports face detection and facial landmarks

3. **TensorFlow.js**:
   - Can run custom models and pre-trained models
   - Flexible but requires more setup

**Eye Contact Detection:**
1. **Custom Model Conversion**: Convert the PyTorch model to TensorFlow.js
   - Will require ONNX as an intermediate format
   - Ensures the same behavior as the original model

2. **Pre-trained Gaze Detection Models**:
   - MediaPipe Face Mesh provides iris tracking which can be used to estimate gaze
   - WebGazer.js as a specialized eye-tracking library

### UI Framework Options

1. **React.js**:
   - Component-based architecture for modular UI development
   - Large ecosystem and community support
   - Easy state management with hooks or Redux

2. **Vue.js**:
   - Progressive framework with gentle learning curve
   - Good performance and flexibility

3. **Svelte**:
   - Compiled approach resulting in smaller bundle size
   - Less boilerplate code

## Recommended Architecture

Based on the current application's requirements and the evaluation of JavaScript options, I recommend:

**Electron-based desktop application with:**
- **face-api.js** for face detection
- **TensorFlow.js** for running the converted eye contact detection model
- **React** for UI components
- **Electron IPC** for communication between UI and main process
- **Node.js file system API** for file operations

This approach provides the best balance of:
1. Maintaining desktop application functionality (file access, window management)
2. Leveraging web technologies for UI development
3. Using established ML libraries that can run the converted eye contact model
4. Keeping the core functionality intact while modernizing the codebase

## Product Requirements Document (PRD)

# PRD: Eye Contact - Interactive Art Installation (JavaScript Refactor)

## 1. App Overview & Objectives

### Purpose
Refactor the existing Python-based "Eye Contact" interactive art installation into a JavaScript-based application while maintaining all core functionality. The application detects when viewers make eye contact with the camera, capturing those moments through screenshots and video recordings.

### Project Organization
- The original Python code will be preserved in the `python/` folder for reference
- The new JavaScript implementation will be developed in the root directory of the project
- This structure maintains access to the original codebase while clearly separating the new implementation

### Project Goals
- Create a cross-platform desktop application using Electron and web technologies
- Maintain all existing functionality of the Python version
- Improve performance and user experience
- Ensure compatibility with existing configuration files and models
- Provide a modern, maintainable codebase

### Key Features to Preserve
- Real-time eye contact detection
- Multi-face tracking
- Screenshot and video capture
- Configuration system with presets
- Visual feedback through UI
- Logging system

## 2. Target Audience

- **Primary**: Artists and installation creators
- **Secondary**: Developers extending the platform
- **Usage Context**: Art galleries, interactive installations, exhibitions

## 3. Core Features & Functionality

### Face Detection & Tracking
- Detect multiple faces simultaneously using face-api.js
- Track faces across frames even when detection temporarily fails
- Apply configurable parameters (confidence threshold, model selection)
- Support multiple camera sources

### Eye Contact Detection
- Port the existing PyTorch model to TensorFlow.js format
- Maintain the same detection accuracy and threshold adjustment
- Analyze cropped face images for eye contact probability
- Provide visual feedback for detected eye contact

### Media Capture
- Capture high-resolution screenshots when eye contact is detected
- Record video clips during eye contact events
- Save media with timestamps and identifiers
- Implement configurable debounce periods between captures

### User Interface
- Main window with camera feed and detection overlays
- Individual windows/panels for detected faces
- Configuration panel with parameter adjustment
- Logging panel for application events
- Support for multi-monitor display setups

### Configuration System
- Load/save configuration presets as JSON
- Dynamic adjustment of parameters during runtime
- Visual controls (sliders, checkboxes) for all parameters
- Reset to default values

## 4. Technical Stack Recommendations

### Application Framework
- **Electron**: For cross-platform desktop application capabilities
- **Node.js**: For backend processes and file system operations

### Frontend
- **React**: For UI components and state management
- **Electron's BrowserWindow**: For multi-window support
- **CSS Modules**: For component styling

### Computer Vision & Machine Learning
- **face-api.js**: For face detection and tracking
- **TensorFlow.js**: For running the eye contact detection model
- **ONNX Runtime Web**: For potential model conversion bridge

### Media Processing
- **MediaRecorder API**: For video recording
- **Canvas API**: For screenshot capture
- **ffmpeg.wasm**: For video processing (if needed)

### Configuration & Storage
- **Electron Store**: For persistent configuration storage
- **React Context API**: For application-wide state management

## 5. Conceptual Data Model

### FaceData
- `id`: String - Unique identifier for the face
- `boundingBox`: Object - x, y, width, height of detected face
- `landmarks`: Array - Facial landmark points
- `eyeContactScore`: Number - Probability of eye contact
- `isLooking`: Boolean - Whether eye contact is detected
- `lastSeen`: Number - Timestamp when face was last detected
- `isRecording`: Boolean - Whether currently recording video

### ConfigurationData
- `faceDetection`: Object - Face detection parameters
- `eyeContact`: Object - Eye contact detection parameters
- `media`: Object - Media capture parameters
- `display`: Object - UI display parameters
- `performance`: Object - Performance-related parameters

### MediaCaptureData
- `type`: String - "screenshot" or "video"
- `faceId`: String - ID of the captured face
- `timestamp`: Number - When the capture occurred
- `path`: String - File path where media is saved
- `duration`: Number - Duration of video (if applicable)

## 6. UI Design Principles

### Layout Structure
- Modular window system with resizable panels
- Camera feed as primary focus
- Face panels arranged in grid format
- Configuration panel in separate window
- Log panel for system messages

### Visual Feedback
- Color-coded bounding boxes for face detection
- Eye contact status indicators
- Recording status indicators
- Real-time parameter adjustment visualization

### Interaction Model
- Keyboard shortcuts for common actions
- Drag-and-drop interface for window arrangement
- Direct manipulation of configuration parameters
- Context menus for additional options

## 7. Security Considerations

### Camera Access
- Request explicit permission for camera access
- Provide clear indication when camera is active
- Allow user to select specific camera device

### File System Access
- Restrict file operations to designated directories
- Proper error handling for file operations
- Secure storage of configuration data

### Application Permissions
- Minimize required permissions to essential functionality
- Handle permission changes gracefully

## 8. Development Phases & Milestones

### Phase 1: Setup & Basic Structure (Weeks 1-2)
- Set up Electron project with React
- Implement multi-window architecture
- Create basic UI components
- Establish application state management

### Phase 2: Face Detection Integration (Weeks 3-4)
- Integrate face-api.js
- Implement face detection and tracking
- Create face panel display system
- Test detection accuracy and performance

### Phase 3: Eye Contact Model Conversion (Weeks 5-6)
- Convert PyTorch model to TensorFlow.js format
- Integrate eye contact detection
- Implement detection parameters
- Test against original model for accuracy

### Phase 4: Media Capture System (Weeks 7-8)
- Implement screenshot capture
- Develop video recording functionality
- Create file management system
- Test media capture quality and performance

### Phase 5: Configuration System (Weeks 9-10)
- Develop configuration UI
- Implement parameter adjustment
- Create preset save/load functionality
- Ensure backward compatibility with existing presets

### Phase 6: Testing & Refinement (Weeks 11-12)
- Comprehensive testing across platforms
- Performance optimization
- Bug fixing
- Documentation

## 9. Potential Challenges & Solutions

### Model Conversion Challenges
- **Challenge**: Converting PyTorch model to TensorFlow.js format
- **Solution**: Use ONNX as intermediate format; if issues persist, consider re-training a model directly in TensorFlow

### Performance Optimization
- **Challenge**: Maintaining high frame rates with ML processing
- **Solution**: Implement worker threads for detection; use requestAnimationFrame for optimal rendering; add frame-skip options

### Multi-Window Management
- **Challenge**: Coordinating multiple Electron windows
- **Solution**: Centralized window management through main process; IPC communication for synchronization

### Camera Access Variations
- **Challenge**: Different camera APIs across platforms
- **Solution**: Abstract camera access behind interface; provide fallback options; test on multiple platforms

## 10. Future Expansion Possibilities

### Enhanced Analytics
- Track engagement metrics
- Generate heatmaps of eye contact frequency
- Export data for further analysis

### Remote Monitoring
- Web interface for remote viewing
- Cloud synchronization of captured media
- Mobile companion app

### Advanced Interaction
- Audio feedback based on eye contact
- Integration with other sensors
- Custom trigger actions on eye contact

### AI Enhancements
- Expression recognition
- Person re-identification
- Attention duration analysis

## 11. Development Tools & Environment

### Required Development Tools
- Visual Studio Code with JavaScript/React extensions
- Node.js v16+ and npm/yarn
- Git for version control
- Electron Forge for building and packaging
- TensorFlow.js tools for model conversion
- Jest for testing

### Development Environment Setup
- Clone repository and install dependencies
- Configure camera access for development
- Set up model conversion pipeline
- Establish testing framework

### Building & Packaging
- Electron Forge for cross-platform builds
- Separate development and production configurations
- Automated build process for all target platforms

## 12. Technical Considerations for Implementation

### Model Loading & Initialization
- Load models asynchronously during startup
- Provide loading indicators and fallbacks
- Cache models for faster subsequent loads

### Camera Stream Processing
- Handle camera API differences across platforms
- Implement frame rate control for performance
- Provide resolution options based on device capabilities

### State Management Architecture
- React Context for application-wide state
- Electron IPC for cross-process communication
- Local component state for UI-specific elements

### File System Integration
- Use Node.js fs module through Electron
- Abstract file operations behind service layer
- Handle permissions and access errors gracefully

### Backward Compatibility
- Support existing configuration format
- Provide migration paths for data
- Maintain compatibility with existing model formats where possible
