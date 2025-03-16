# Gaze Detection Application

An Electron application for eye contact detection using webcam.

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the application:
   ```
   npm start
   ```

## Development

- Main process: `src/index.js`
- Renderer process: `src/index.html`, `src/index.css`
- Preload script: `src/preload.js`

## Project Structure

- `src/`: Source code
  - `index.js`: Main process entry point
  - `index.html`: Renderer process HTML
  - `index.css`: Renderer process styles
  - `preload.js`: Preload script for secure IPC communication

## License

MIT