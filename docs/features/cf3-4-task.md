## Task CF3-4: Create Detection Visualization [ ]

### Status
- [x] Not Started
- [ ] In Progress
- [ ] Complete
- [ ] Verified

### Objective
Display eye contact detection status clearly in the UI with intuitive visual indicators that immediately communicate the detection state to users.

### Starting Point
- Eye contact detection with state management from CF3-3
- Application UI layout from CF1

### Done When
- UI clearly indicates when eye contact is detected
- Status changes are immediately visible
- Visualization doesn't interfere with application performance
- Indicators are intuitive and easy to understand
- Visualization includes confidence level indication
- Indicators are visible in various lighting conditions
- Animation provides smooth transitions between states
- Visualization works for multiple faces if needed

### Implementation Guidelines
- Create detection overlay component:
  ```jsx
  function DetectionOverlay({ videoRef }) {
    const { faces, currentFaceId } = useFaceState();
    const canvasRef = useRef(null);
    
    // Set up canvas size and position to match video
    useEffect(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (!video || !canvas) return;
      
      const resizeObserver = new ResizeObserver(() => {
        canvas.width = video.clientWidth;
        canvas.height = video.clientHeight;
        updateCanvas();
      });
      
      resizeObserver.observe(video);
      
      return () => {
        resizeObserver.disconnect();
      };
    }, [videoRef]);
    
    // Draw detection visualization
    const updateCanvas = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Get video dimensions for scaling
      const video = videoRef.current;
      if (!video) return;
      
      const scaleX = canvas.width / video.videoWidth;
      const scaleY = canvas.height / video.videoHeight;
      
      // Draw each face
      Object.values(faces).forEach(face => {
        if (!face.visible) return;
        
        const { boundingBox, isLooking, eyeContactScore } = face;
        
        // Scale coordinates to match canvas
        const box = {
          x: boundingBox.x * scaleX,
          y: boundingBox.y * scaleY,
          width: boundingBox.width * scaleX,
          height: boundingBox.height * scaleY
        };
        
        // Draw face bounding box
        ctx.lineWidth = 2;
        ctx.strokeStyle = isLooking ? '#00ff00' : '#ff0000';
        ctx.strokeRect(box.x, box.y, box.width, box.height);
        
        // Draw eye contact indicator
        const indicatorSize = Math.min(box.width, box.height) * 0.2;
        ctx.fillStyle = isLooking ? '#00ff00' : '#ff0000';
        ctx.beginPath();
        ctx.arc(
          box.x + box.width - indicatorSize, 
          box.y + indicatorSize, 
          indicatorSize / 2, 
          0, 
          Math.PI * 2
        );
        ctx.fill();
        
        // Draw confidence text
        if (eyeContactScore !== undefined) {
          const confidenceText = `${(eyeContactScore * 100).toFixed(0)}%`;
          ctx.font = '14px Arial';
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 3;
          ctx.strokeText(confidenceText, box.x, box.y - 5);
          ctx.fillText(confidenceText, box.x, box.y - 5);
        }
      });
    }, [faces, videoRef]);
    
    // Update canvas on face data changes
    useEffect(() => {
      updateCanvas();
    }, [faces, updateCanvas]);
    
    return (
      <canvas 
        ref={canvasRef}
        className="detection-overlay"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none'
        }}
      />
    );
  }
  ```

- Create status indicator component:
  ```jsx
  function EyeContactIndicator({ faceId }) {
    const face = useFaceById(faceId);
    const [animState, setAnimState] = useState('inactive');
    
    // Update animation state when detection changes
    useEffect(() => {
      if (!face) {
        setAnimState('inactive');
        return;
      }
      
      setAnimState(face.isLooking ? 'active' : 'inactive');
    }, [face]);
    
    if (!face) return null;
    
    return (
      <div className="eye-contact-indicator">
        <div 
          className={`indicator-circle ${animState}`}
          style={{
            backgroundColor: face.isLooking ? '#00ff00' : '#ff0000'
          }}
        />
        <div className="indicator-label">
          {face.isLooking ? 'Eye Contact Detected' : 'No Eye Contact'}
        </div>
        {face.eyeContactScore !== undefined && (
          <div className="indicator-confidence">
            Confidence: {(face.eyeContactScore * 100).toFixed(0)}%
          </div>
        )}
        {face.isLooking && face.lookingSince && (
          <div className="indicator-duration">
            Looking for: {formatDuration(Date.now() - face.lookingSince)}
          </div>
        )}
      </div>
    );
  }
  ```

- Add CSS animations for smooth transitions:
  ```css
  .indicator-circle {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    transition: background-color 0.3s ease, transform 0.3s ease;
  }
  
  .indicator-circle.active {
    transform: scale(1.2);
    box-shadow: 0 0 10px rgba(0, 255, 0, 0.7);
  }
  
  .indicator-circle.inactive {
    transform: scale(1);
    box-shadow: none;
  }
  ```

- Implement global status indicators:
  - Create header or floating status display
  - Add sound or visual effects for state changes
  - Show aggregate status for multiple faces
  - Provide history visualization of recent states

- Optimize visualization performance:
  - Use requestAnimationFrame for smooth animations
  - Throttle updates for performance
  - Consider using CSS transforms for animations
  - Minimize canvas redraws when possible

- Common pitfalls to avoid:
  - Overly complex or distracting visualizations
  - Poor visibility in varied lighting conditions
  - Performance impact from excessive animation
  - Visualizations that don't scale with window size

### Dependencies
- Requires completion of CF3-3 (Detection State Management)
- Maximum time box: 5 hours