## Task LL2-3: Create Application Packaging [ ]

### Status
- [x] Not Started
- [ ] In Progress
- [ ] Complete
- [ ] Verified

### Objective
Configure build process to create installable packages for the target platform, allowing for easy distribution and installation.

### Starting Point
- Functional application with all core features
- Development build process only

### Done When
- Application can be built into installable package
- Package includes all required dependencies
- Installation works on clean system
- Basic build documentation is created
- Icons and metadata are configured
- Build process is reproducible
- Package size is reasonable
- Installation requires minimal user intervention

### Implementation Guidelines
- Configure electron-builder for packaging:
  ```javascript
  // package.json
  {
    "name": "gaze-detection",
    "version": "0.1.0",
    "description": "Eye contact detection application",
    "main": "src/main/index.js",
    "scripts": {
      "start": "electron-forge start",
      "package": "electron-forge package",
      "make": "electron-forge make",
      "publish": "electron-forge publish"
    },
    "build": {
      "appId": "com.example.gaze-detection",
      "productName": "Gaze Detection",
      "copyright": "Copyright © 2023",
      "files": [
        "src/**/*",
        "node_modules/**/*",
        "package.json",
        "assets/**/*"
      ],
      "directories": {
        "buildResources": "resources",
        "output": "dist"
      },
      "extraResources": [
        {
          "from": "assets/models",
          "to": "models"
        }
      ],
      "win": {
        "target": [
          "nsis"
        ],
        "icon": "resources/icon.ico"
      },
      "mac": {
        "target": [
          "dmg"
        ],
        "icon": "resources/icon.icns",
        "category": "public.app-category.graphics-design"
      },
      "linux": {
        "target": [
          "AppImage"
        ],
        "icon": "resources/icon.png",
        "category": "Graphics"
      },
      "nsis": {
        "oneClick": false,
        "allowToChangeInstallationDirectory": true,
        "createDesktopShortcut": true
      }
    }
  }
  ```

- Create application icons and metadata:
  - Generate icons for all platforms (Windows, macOS, Linux)
  - Create proper app metadata (name, description, version)
  - Add copyright and license information
  - Configure application categories

- Implement build scripts:
  ```bash
  # Build for current platform
  npm run make
  
  # Build for specific platform
  npm run make -- --platform=win32
  npm run make -- --platform=darwin
  npm run make -- --platform=linux
  ```

- Configure resource handling:
  - Ensure ML models are included in package
  - Handle assets and static files correctly
  - Set up path resolution for packaged app
  - Create resource loading utility

- Create build documentation:
  ```markdown
  # Build and Distribution Guide
  
  ## Prerequisites
  - Node.js v14 or higher
  - npm v7 or higher
  - For Windows builds: Windows 10+
  - For macOS builds: macOS 10.15+
  - For Linux builds: Ubuntu 18.04+ (or equivalent)
  
  ## Development Build
  
  ```bash
  # Install dependencies
  npm install
  
  # Start development version
  npm start
  ```
  
  ## Production Build
  
  ```bash
  # Package application
  npm run package
  
  # Create distributable for current platform
  npm run make
  ```
  
  ## Platform-Specific Builds
  
  ### Windows
  ```bash
  npm run make -- --platform=win32
  ```
  
  Output: `dist/Gaze Detection Setup x.y.z.exe`
  
  ### macOS
  ```bash
  npm run make -- --platform=darwin
  ```
  
  Output: `dist/Gaze Detection-x.y.z.dmg`
  
  ### Linux
  ```bash
  npm run make -- --platform=linux
  ```
  
  Output: `dist/Gaze Detection-x.y.z.AppImage`
  ```

- Implement installation verification:
  - Test installation on clean system
  - Verify all resources load correctly
  - Check for proper permissions
  - Test startup after installation

- Common pitfalls to avoid:
  - Missing dependencies in packaged app
  - Incorrect path resolution after packaging
  - Large package size due to unnecessary files
  - Platform-specific issues not caught during development

### Dependencies
- Requires all core application features
- Maximum time box: 5 hours