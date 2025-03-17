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

### Development Workflow

This project uses several tools to ensure code quality and consistency:

#### Linting and Formatting

- **ESLint**: Checks code for errors and enforces coding standards
  ```
  npm run lint       # Check for linting errors
  npm run lint:fix   # Fix linting errors automatically
  ```

- **Prettier**: Formats code consistently
  ```
  npm run format     # Format all code files
  ```

#### Type Checking

- **TypeScript**: Provides type checking for JavaScript files
  ```
  npm run typecheck  # Run type checking
  ```

#### Testing

- **Jest**: Runs unit and integration tests
  ```
  npm run test           # Run all tests
  npm run test:watch     # Run tests in watch mode
  npm run test:coverage  # Run tests with coverage report
  ```

#### Pre-commit Hooks

The project uses Husky and lint-staged to run linting and formatting on staged files before committing.

## Project Structure

- `src/`: Source code
  - `index.js`: Main process entry point
  - `index.html`: Renderer process HTML
  - `index.css`: Renderer process styles
  - `preload.js`: Preload script for secure IPC communication
  - `__tests__/`: Test files

## License

MIT
