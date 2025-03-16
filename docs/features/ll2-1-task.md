## Task LL2-1: Implement Screenshot Capture [ ]

### Status
- [x] Not Started
- [ ] In Progress
- [ ] Complete
- [ ] Verified

### Objective
Create functionality to capture and save screenshots when eye contact is detected, with appropriate naming and organization.

### Starting Point
- Working eye contact detection functionality
- No existing screenshot capture capability

### Done When
- Screenshots are captured when eye contact is detected
- Images are saved to user-specified location
- Filenames include timestamps for identification
- Capture has configurable debounce to prevent duplicates
- User receives visual confirmation of capture
- Screenshot quality is configurable
- Captured images are accessible to the user
- Error handling for file system issues is implemented

### Implementation Guidelines
- Create screenshot capture service:
  ```javascript
  class ScreenshotCaptureService {
    constructor(options = {}) {
      this.options = {
        saveDirectory: options.saveDirectory || app.getPath('pictures'),
        format: options.format || 'png',
        quality: options.quality || 0.9,
        debounceTime: options.debounceTime || 2000, // ms
        filenamePattern: options.filenamePattern || 'eye-contact-{timestamp}'
      };
      
      this.lastCaptureTime = {};
      this.ensureSaveDirectoryExists();
    }
    
    ensureSaveDirectoryExists() {
      if (!fs.existsSync(this.options.saveDirectory)) {
        fs.mkdirSync(this.options.saveDirectory, { recursive: true });
      }
    }
    
    async captureScreenshot(videoElement, faceId) {
      const now = Date.now();
      
      // Check debounce
      if (this.lastCaptureTime[faceId] && 
          now - this.lastCaptureTime[faceId] < this.options.debounceTime) {
        return null;
      }
      
      try {
        // Create canvas same size as video
        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        
        // Draw video frame to canvas
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        
        // Generate filename
        const timestamp = new Date().toISOString()
          .replace(/:/g, '-')
          .replace(/\..+/, '');
        
        const filename = this.options.filenamePattern
          .replace('{timestamp}', timestamp)
          .replace('{faceid}', faceId);
        
        const filePath = path.join(
          this.options.saveDirectory, 
          `${filename}.${this.options.format}`
        );
        
        // Convert canvas to image data
        let imageData;
        if (this.options.format === 'png') {
          imageData = canvas.toDataURL('image/png');
        } else {
          imageData = canvas.toDataURL('image/jpeg', this.options.quality);
        }
        
        // Remove data URL prefix
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
        
        // Save to file
        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
        
        // Update last capture time
        this.lastCaptureTime[faceId] = now;
        
        return {
          path: filePath,
          timestamp: now,
          faceId
        };
      } catch (error) {
        console.error('Screenshot capture error:', error);
        return null;
      }
    }
    
    setSaveDirectory(directory) {
      this.options.saveDirectory = directory;
      this.ensureSaveDirectoryExists();
    }
    
    setFormat(format) {
      if (['png', 'jpg', 'jpeg'].includes(format)) {
        this.options.format = format;
      }
    }
    
    setQuality(quality) {
      this.options.quality = Math.min(Math.max(quality, 0.1), 1.0);
    }
    
    setDebounceTime(time) {
      this.options.debounceTime = time;
    }
  }
  ```

- Integrate with eye contact detection:
  ```javascript
  function useScreenshotCapture(videoRef) {
    const [captureService] = useState(() => new ScreenshotCaptureService({
      saveDirectory: config.capture.saveDirectory,
      format: config.capture.format,
      quality: config.capture.quality,
      debounceTime: config.capture.debounceTime
    }));
    
    const { faces } = useFaceState();
    const [lastCapture, setLastCapture] = useState(null);
    
    // Update service config when app config changes
    useEffect(() => {
      captureService.setSaveDirectory(config.capture.saveDirectory);
      captureService.setFormat(config.capture.format);
      captureService.setQuality(config.capture.quality);
      captureService.setDebounceTime(config.capture.debounceTime);
    }, [config.capture]);
    
    // Monitor for eye contact to trigger capture
    useEffect(() => {
      if (!videoRef.current || !config.capture.enabled) return;
      
      // Check each face for new eye contact
      Object.values(faces).forEach(face => {
        if (face.isLooking && face.lookingSince) {
          // Check if this is new eye contact that needs capturing
          const lastCaptureForFace = captureService.lastCaptureTime[face.id] || 0;
          
          if (face.lookingSince > lastCaptureForFace) {
            captureScreenshot(face.id);
          }
        }
      });
    }, [faces, videoRef.current]);
    
    const captureScreenshot = async (faceId) => {
      if (!videoRef.current) return;
      
      const result = await captureService.captureScreenshot(
        videoRef.current,
        faceId
      );
      
      if (result) {
        setLastCapture(result);
        // Optionally show notification or update UI
      }
    };
    
    return {
      lastCapture,
      captureScreenshot // For manual captures
    };
  }
  ```

- Add UI elements for capture feedback:
  - Toast notification on successful capture
  - Small thumbnail preview of captured image
  - Error message for failed captures
  - Capture count indicator

- Implement configuration UI:
  - Save directory selection
  - Format options (PNG/JPG)
  - Quality slider for JPG
  - Debounce time adjustment
  - Auto-capture toggle

- Add error handling:
  - Check for write permissions
  - Verify directory exists
  - Handle disk space issues
  - Recover from temporary file system errors

- Common pitfalls to avoid:
  - Not checking file write permissions
  - Capturing too frequently (resource intensive)
  - Poor error communication to users
  - Blocking UI thread during file operations

### Dependencies
- Requires eye contact detection functionality (CF3)
- Maximum time box: 6 hours