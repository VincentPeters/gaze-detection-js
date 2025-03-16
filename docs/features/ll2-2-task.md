## Task LL2-2: Implement Configuration Persistence [ ]

### Status
- [x] Not Started
- [ ] In Progress
- [ ] Complete
- [ ] Verified

### Objective
Ensure user configuration is properly saved and loaded between application sessions to preserve settings and preferences.

### Starting Point
- Working configuration system from MS2-4
- Configuration only exists during runtime

### Done When
- Configuration is automatically saved when changed
- Settings persist between application restarts
- User configurations are stored in appropriate location
- Default configuration is used for missing settings
- Configuration file format is documented
- Migration path exists for future changes
- Error handling for invalid configuration
- User interface reflects persisted settings on startup

### Implementation Guidelines
- Enhance configuration service to handle persistence:
  ```javascript
  const Store = require('electron-store');
  
  class ConfigurationService {
    constructor(options = {}) {
      this.defaultConfig = {
        camera: {
          deviceId: '',
          resolution: { width: 1280, height: 720 }
        },
        detection: {
          enabled: true,
          faceConfidence: 0.5,
          eyeContactThreshold: 0.7,
          detectionFrequency: 1 // frames to skip
        },
        capture: {
          enabled: true,
          saveDirectory: options.defaultSaveDirectory || '',
          format: 'png',
          quality: 0.9,
          debounceTime: 2000
        },
        ui: {
          showConfidence: true,
          showFps: true,
          theme: 'light'
        }
      };
      
      // Schema for electron-store validation
      const schema = {
        camera: {
          type: 'object',
          properties: {
            deviceId: { type: 'string' },
            resolution: {
              type: 'object',
              properties: {
                width: { type: 'number', minimum: 320, maximum: 4096 },
                height: { type: 'number', minimum: 240, maximum: 2160 }
              }
            }
          }
        },
        detection: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            faceConfidence: { type: 'number', minimum: 0.1, maximum: 1.0 },
            eyeContactThreshold: { type: 'number', minimum: 0.1, maximum: 1.0 },
            detectionFrequency: { type: 'number', minimum: 1, maximum: 10 }
          }
        },
        capture: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            saveDirectory: { type: 'string' },
            format: { type: 'string', enum: ['png', 'jpg'] },
            quality: { type: 'number', minimum: 0.1, maximum: 1.0 },
            debounceTime: { type: 'number', minimum: 500, maximum: 10000 }
          }
        },
        ui: {
          type: 'object',
          properties: {
            showConfidence: { type: 'boolean' },
            showFps: { type: 'boolean' },
            theme: { type: 'string', enum: ['light', 'dark'] }
          }
        }
      };
      
      // Initialize store with schema and defaults
      this.store = new Store({ 
        schema,
        defaults: this.defaultConfig,
        migrations: this.getMigrations()
      });
      
      // Initialize runtime config
      this.config = this.store.store;
      
      // Set defaults for non-existent properties (in case of partial migration)
      this.setMissingDefaults(this.config, this.defaultConfig);
    }
    
    setMissingDefaults(config, defaults, path = '') {
      Object.keys(defaults).forEach(key => {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (typeof defaults[key] === 'object' && !Array.isArray(defaults[key])) {
          // Recurse for nested objects
          if (!config[key]) {
            config[key] = {};
          }
          this.setMissingDefaults(config[key], defaults[key], currentPath);
        } else if (config[key] === undefined) {
          // Set default for missing property
          config[key] = defaults[key];
          this.store.set(currentPath, defaults[key]);
        }
      });
    }
    
    get(key, defaultValue) {
      return key ? this.store.get(key, defaultValue) : this.config;
    }
    
    set(key, value) {
      this.store.set(key, value);
      this.config = this.store.store; // Update runtime cache
      return value;
    }
    
    reset(key) {
      if (key) {
        // Reset specific key to default
        const defaultValue = this.getDefaultValue(key);
        if (defaultValue !== undefined) {
          this.set(key, defaultValue);
        }
      } else {
        // Reset everything
        this.store.clear();
        this.store.store = { ...this.defaultConfig };
        this.config = this.store.store;
      }
    }
    
    getDefaultValue(key) {
      const parts = key.split('.');
      let value = this.defaultConfig;
      
      for (const part of parts) {
        if (value[part] === undefined) {
          return undefined;
        }
        value = value[part];
      }
      
      return value;
    }
    
    getMigrations() {
      // Define migrations for future schema changes
      return {
        // Example migration for future versions
        '1.0.0': store => {
          // Migration logic here
        }
      };
    }
  }
  ```

- Set up auto-saving configuration:
  ```javascript
  function useConfig() {
    const [config, setConfig] = useState(() => configService.get());
    
    // Update local state when config changes externally
    useEffect(() => {
      const handleConfigChange = () => {
        setConfig(configService.get());
      };
      
      // Listen for config change events if applicable
      // ...
      
      return () => {
        // Remove listeners
      };
    }, []);
    
    const updateConfig = useCallback((key, value) => {
      configService.set(key, value);
      setConfig(configService.get());
    }, []);
    
    const resetConfig = useCallback((key) => {
      configService.reset(key);
      setConfig(configService.get());
    }, []);
    
    return {
      config,
      updateConfig,
      resetConfig
    };
  }
  ```

- Add configuration UI components:
  - Save directory selection dialog
  - Reset to defaults button
  - Configuration export/import
  - Clear visual indication of changes

- Implement secure storage:
  - Use appropriate app data location
  - Handle file permissions correctly
  - Encrypt sensitive information if needed
  - Implement backup mechanism

- Add validation and error handling:
  - Validate values before saving
  - Handle corrupted configuration files
  - Log configuration errors
  - Provide recovery options for invalid config

- Common pitfalls to avoid:
  - Storing absolute paths that won't work across systems
  - Not validating configuration before using it
  - Poor error handling for invalid configurations
  - Saving too frequently (performance impact)

### Dependencies
- Requires configuration system from MS2-4
- Maximum time box: 5 hours