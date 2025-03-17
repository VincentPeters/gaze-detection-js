/**
 * MainWindow Tests
 *
 * Tests for the MainWindow class and its functionality.
 */

import { BrowserWindow } from 'electron';
import MainWindow from '../main/windows/MainWindow';
import stateStore from '../main/state/store';

// Mock the required modules
jest.mock('electron', () => ({
  BrowserWindow: jest.fn().mockImplementation(() => ({
    loadURL: jest.fn(),
    loadFile: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
    webContents: {
      openDevTools: jest.fn(),
      on: jest.fn(),
      setWindowOpenHandler: jest.fn(),
      toggleDevTools: jest.fn(),
      send: jest.fn(),
    },
    maximize: jest.fn(),
    focus: jest.fn(),
    getBounds: jest.fn().mockReturnValue({ x: 100, y: 100, width: 1024, height: 768 }),
    isMaximized: jest.fn().mockReturnValue(false),
    isMinimized: jest.fn().mockReturnValue(false),
    isDestroyed: jest.fn().mockReturnValue(false),
    close: jest.fn(),
    id: 1,
  })),
  app: {
    getName: jest.fn().mockReturnValue('Gaze Detection'),
    getVersion: jest.fn().mockReturnValue('1.0.0'),
  },
  shell: {
    openExternal: jest.fn(),
  },
  Menu: {
    buildFromTemplate: jest.fn().mockReturnValue({}),
    setApplicationMenu: jest.fn(),
  },
}));

jest.mock('../main/state/store', () => ({
  getState: jest.fn(),
  setState: jest.fn(),
}));

jest.mock('../utils/logger/index.js', () => ({
  createLogger: jest.fn().mockReturnValue({
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  }),
}));

jest.mock('electron-is-dev', () => true);

jest.mock('../main/windows/KeyboardShortcutManager.js', () => ({
  registerShortcuts: jest.fn(),
}));

describe('MainWindow', () => {
  let mainWindow;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    stateStore.getState.mockReturnValue(null);

    // Create a new instance
    mainWindow = new MainWindow();
  });

  test('should create a window instance', () => {
    const window = mainWindow.create();

    // Verify BrowserWindow was created
    expect(BrowserWindow).toHaveBeenCalled();
    expect(window).toBeDefined();
  });

  test('should load state from store', () => {
    const mockState = {
      width: 1200,
      height: 800,
      x: 50,
      y: 50,
      isMaximized: true,
    };

    stateStore.getState.mockReturnValue(mockState);

    // Create a new instance to load from state
    const windowWithState = new MainWindow();
    const state = windowWithState.windowState;

    // Verify state is loaded from store
    expect(state.width).toBe(mockState.width);
    expect(state.height).toBe(mockState.height);
    expect(state.x).toBe(mockState.x);
    expect(state.y).toBe(mockState.y);
    expect(state.isMaximized).toBe(mockState.isMaximized);
  });

  test('should save window state', () => {
    const window = mainWindow.create();

    // Call saveWindowState
    mainWindow.saveWindowState();

    // Verify state is saved to store
    expect(stateStore.setState).toHaveBeenCalledWith('mainWindow', 'width', expect.any(Number));
    expect(stateStore.setState).toHaveBeenCalledWith('mainWindow', 'height', expect.any(Number));
    expect(stateStore.setState).toHaveBeenCalledWith('mainWindow', 'isMaximized', expect.any(Boolean));
    expect(stateStore.setState).toHaveBeenCalledWith('mainWindow', 'x', expect.any(Number));
    expect(stateStore.setState).toHaveBeenCalledWith('mainWindow', 'y', expect.any(Number));
  });

  test('should use default values when no state exists', () => {
    stateStore.getState.mockReturnValue(null);

    // Create a new instance with no stored state
    const defaultWindow = new MainWindow();
    const state = defaultWindow.windowState;

    // Verify default values are used
    expect(state.width).toBe(1024);
    expect(state.height).toBe(768);
    expect(state.isMaximized).toBe(false);
  });

  test('should return existing window if already created', () => {
    // Create window first time
    const firstWindow = mainWindow.create();

    // Create window second time
    const secondWindow = mainWindow.create();

    // Verify BrowserWindow was only created once
    expect(BrowserWindow).toHaveBeenCalledTimes(1);
    expect(firstWindow).toBe(secondWindow);
  });

  test('should close window', () => {
    const window = mainWindow.create();

    // Close window
    mainWindow.close();

    // Verify close was called
    expect(window.close).toHaveBeenCalled();
  });
});
