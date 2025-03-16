## Task CF3-2: Implement Eye Contact Detection Pipeline [ ]

### Status
- [x] Not Started
- [ ] In Progress
- [ ] Complete
- [ ] Verified

### Objective
Create the processing pipeline from face detection to eye contact detection that prepares data for the model and interprets results efficiently.

### Starting Point
- Converted eye contact detection model from CF3-1
- Face detection and tracking system from CF2

### Done When
- Face detection results are properly prepared for the eye contact model
- Pipeline extracts face image with proper preprocessing
- Model receives appropriate input format
- Detection results are processed and interpreted
- Pipeline runs efficiently without blocking the UI
- Results include confidence scores
- Pipeline handles multiple faces if needed
- Integration with face tracking ensures consistent detection

### Implementation Guidelines
- Create the eye contact detection pipeline:
  ```javascript
  async function detectEyeContact(video, faceData, model, options = {}) {
    const { 
      threshold = 0.7,
      inputSize = 64,
      grayscale = true 
    } = options;
    
    if (!video || !faceData || !faceData.boundingBox || !model) {
      return { isLooking: false, confidence: 0 };
    }
    
    try {
      // Extract face from video
      const faceImage = await extractFaceImage(
        video, 
        faceData.boundingBox, 
        inputSize,
        grayscale
      );
      
      // Preprocess image for model
      const inputTensor = preprocessImage(faceImage, inputSize);
      
      // Run inference
      const result = await model.predict(inputTensor);
      
      // Get confidence value from result (depends on model output format)
      const confidence = result[0];
      
      // Clean up tensors
      inputTensor.dispose();
      
      // Return detection result
      return {
        isLooking: confidence > threshold,
        confidence
      };
    } catch (error) {
      console.error('Eye contact detection error:', error);
      return { isLooking: false, confidence: 0 };
    }
  }
  
  async function extractFaceImage(video, boundingBox, size, grayscale) {
    // Create canvas to extract face region
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Draw face region to canvas with appropriate scaling
    ctx.drawImage(
      video,
      boundingBox.x, boundingBox.y, boundingBox.width, boundingBox.height,
      0, 0, size, size
    );
    
    // Apply grayscale if needed
    if (grayscale) {
      const imageData = ctx.getImageData(0, 0, size, size);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = avg; // red
        data[i + 1] = avg; // green
        data[i + 2] = avg; // blue
      }
      
      ctx.putImageData(imageData, 0, 0);
    }
    
    return canvas;
  }
  
  function preprocessImage(canvas, inputSize) {
    // Convert canvas to tensor and normalize
    return tf.tidy(() => {
      const tensor = tf.browser.fromPixels(canvas);
      
      // Normalize to match model expectations (0-1 or -1 to 1)
      const normalized = tensor.toFloat().div(tf.scalar(255));
      
      // Reshape if needed for model input
      return normalized.expandDims(0);
    });
  }
  ```

- Implement pipeline integration with detection system:
  - Create detection manager to coordinate processes
  - Connect with face tracking for consistent IDs
  - Implement batching for multiple faces
  - Add throttling for performance

- Optimize the pipeline for performance:
  - Run detection on lower frequency than tracking
  - Implement Web Workers for non-blocking processing
  - Reuse canvases and buffers where possible
  - Properly dispose of tensors to prevent memory leaks

- Add appropriate error handling:
  - Graceful degradation for model failures
  - Clear error states for debugging
  - Recovery mechanisms for temporary failures
  - Performance monitoring for slow detection

- Common pitfalls to avoid:
  - Memory leaks from undisposed tensors
  - Blocking the UI thread with synchronous processing
  - Incorrect preprocessing of images for model
  - Inefficient canvas operations

### Dependencies
- Requires completion of CF3-1 (Model Conversion)
- Requires completion of CF2 (Data Essentials)
- Maximum time box: 8 hours