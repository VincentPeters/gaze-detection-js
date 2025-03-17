// Add any global test setup here
// Import @testing-library/jest-dom for DOM testing assertions
import '@testing-library/jest-dom';

// Mock Electron
jest.mock('electron', () => ({
  app: {
    getPath: jest.fn(() => '/mock/path'),
  },
  ipcMain: {
    on: jest.fn(),
    handle: jest.fn(),
  },
  ipcRenderer: {
    on: jest.fn(),
    invoke: jest.fn(),
    send: jest.fn(),
  },
  contextBridge: {
    exposeInMainWorld: jest.fn(),
  },
  BrowserWindow: jest.fn().mockImplementation(() => ({
    loadURL: jest.fn(),
    loadFile: jest.fn(),
    webContents: {
      openDevTools: jest.fn(),
    },
    on: jest.fn(),
    show: jest.fn(),
    maximize: jest.fn(),
  })),
}), { virtual: true });
